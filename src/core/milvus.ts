import {
  MilvusClient,
  DataType,
  SearchResults,
  SearchReq,
  QueryResults,
  FlushReq,
  SearchResultData,
} from "@zilliz/milvus2-sdk-node";

const COLLECTION_NAME = "documents";
const VECTOR_DIM = 1024; // bge-m3 dimension

let client: MilvusClient | null = null;

export async function getMilvusClient(): Promise<MilvusClient> {
  if (!client) {
    const host = process.env.MILVUS_HOST || "localhost:19530";
    client = new MilvusClient({ address: host });
  }
  return client;
}

export async function initializeCollection(): Promise<void> {
  const milvus = await getMilvusClient();

  // Check if collection exists
  const hasCollection = await milvus.hasCollection({
    collection_name: COLLECTION_NAME,
  });

  if (hasCollection.value) {
    // ensure collection is loaded (for search immediately after restart)
    await milvus.loadCollection({ collection_name: COLLECTION_NAME });
    return;
  }

  // Create collection
  await milvus.createCollection({
    collection_name: COLLECTION_NAME,
    fields: [
      {
        name: "id",
        description: "Primary key",
        data_type: DataType.VarChar,
        max_length: 100,
        is_primary_key: true,
      },
      {
        name: "vector",
        description: "Text embedding vector",
        data_type: DataType.FloatVector,
        dim: VECTOR_DIM,
      },
      {
        name: "user_id",
        description: "User identifier for isolation",
        data_type: DataType.VarChar,
        max_length: 50,
      },
      {
        name: "workspace_id",
        description: "Workspace identifier for data organization",
        data_type: DataType.VarChar,
        max_length: 50,
      },
      {
        name: "doc_id",
        description: "Document identifier",
        data_type: DataType.VarChar,
        max_length: 100,
      },
      {
        name: "chunk_id",
        description: "Chunk identifier",
        data_type: DataType.VarChar,
        max_length: 100,
      },
      {
        name: "text",
        description: "Original text content",
        data_type: DataType.VarChar,
        max_length: 2000,
      },
    ],
  });

  // Create index on vector field
  await milvus.createIndex({
    collection_name: COLLECTION_NAME,
    field_name: "vector",
    index_type: "HNSW",
    metric_type: "COSINE",
    params: { M: 16, efConstruction: 200 },
  });

  // Load collection
  await milvus.loadCollection({
    collection_name: COLLECTION_NAME,
  });
}

export interface MilvusDocument {
  id: string;
  vector: number[];
  user_id: string;
  workspace_id: string;
  doc_id: string;
  chunk_id: string;
  text: string;
  [key: string]: any;
}

export interface MilvusSearchResult {
  id: string;
  user_id: string;
  workspace_id: string;
  doc_id: string;
  chunk_id: string;
  text: string;
  score: number;
}

export async function insertDocuments(
  documents: MilvusDocument[]
): Promise<void> {
  const milvus = await getMilvusClient();

  await milvus.insert({
    collection_name: COLLECTION_NAME,
    data: documents,
  });

  // Обеспечить видимость данных для поиска
  try {
    const flushReq: FlushReq = { collection_names: [COLLECTION_NAME] };
    await milvus.flush(flushReq);
    await milvus.loadCollection({ collection_name: COLLECTION_NAME });
  } catch (e) {
    // Suppress flush warnings
  }
}

export async function deleteUserDocument(
  userId: string,
  workspaceId: string,
  docId: string
): Promise<{ deleted: boolean }> {
  const milvus = await getMilvusClient();
  // Удаляем все чанки документа пользователя в рамках workspace
  const expr = `user_id == "${userId}" && workspace_id == "${workspaceId}" && doc_id == "${docId}"`;
  await milvus.deleteEntities({
    collection_name: COLLECTION_NAME,
    expr,
  });
  try {
    const flushReq: FlushReq = { collection_names: [COLLECTION_NAME] };
    await milvus.flush(flushReq);
    await milvus.loadCollection({ collection_name: COLLECTION_NAME });
  } catch (e) {
    // Suppress flush warnings
  }
  return { deleted: true };
}

export async function deleteUserWorkspaceDocuments(
  userId: string,
  workspaceId: string
): Promise<{ deleted: boolean }> {
  const milvus = await getMilvusClient();
  // Удаляем ВСЕ документы пользователя в рамках workspace
  const expr = `user_id == "${userId}" && workspace_id == "${workspaceId}"`;
  await milvus.deleteEntities({
    collection_name: COLLECTION_NAME,
    expr,
  });
  try {
    const flushReq: FlushReq = { collection_names: [COLLECTION_NAME] };
    await milvus.flush(flushReq);
    await milvus.loadCollection({ collection_name: COLLECTION_NAME });
  } catch (e) {
    // Suppress flush warnings
  }
  return { deleted: true };
}

export interface UserDocumentSummary {
  doc_id: string;
  chunks: number;
}

export async function listUserDocuments(
  userId: string,
  workspaceId?: string
): Promise<UserDocumentSummary[]> {
  const milvus = await getMilvusClient();
  const filter = workspaceId
    ? `user_id == "${userId}" && workspace_id == "${workspaceId}"`
    : `user_id == "${userId}"`;
  const res: QueryResults = await milvus.query({
    collection_name: COLLECTION_NAME,
    filter,
    output_fields: ["doc_id"],
  });

  const counts = new Map<string, number>();
  for (const row of res.data) {
    const docId = row.doc_id;
    if (typeof docId === "string") {
      counts.set(docId, (counts.get(docId) || 0) + 1);
    }
  }
  return Array.from(counts.entries()).map(([doc_id, chunks]) => ({
    doc_id,
    chunks,
  }));
}

export async function searchSimilar(
  vector: number[],
  userId: string,
  workspaceId: string,
  topK: number = 30
): Promise<MilvusSearchResult[]> {
  const milvus = await getMilvusClient();
  const ef = Number(process.env.RAG_EF) || 200;

  const results = await milvus.search({
    collection_name: COLLECTION_NAME,
    data: [vector],
    anns_field: "vector",
    topk: topK,
    metric_type: "COSINE",
    params: { ef },
    filter: `user_id == "${userId}" && workspace_id == "${workspaceId}"`,
    output_fields: [
      "id",
      "user_id",
      "workspace_id",
      "doc_id",
      "chunk_id",
      "text",
    ],
  });

  // SDK возвращает results как массив для каждого вектора запроса
  // Мы передаем один вектор, поэтому берем первый элемент
  const rawResults = (results as any).results;
  const items: SearchResultData[] = Array.isArray(rawResults)
    ? Array.isArray(rawResults[0])
      ? rawResults[0]
      : rawResults
    : [];

  return items.map((item): MilvusSearchResult => {
    return {
      id: String(item.id ?? ""),
      user_id: String(item.user_id ?? ""),
      workspace_id: String(item.workspace_id ?? ""),
      doc_id: String(item.doc_id ?? ""),
      chunk_id: String(item.chunk_id ?? ""),
      text: String(item.text ?? ""),
      score: typeof item.score === "number" ? item.score : 0,
    };
  });
}
