import { apiClient } from "@/shared/api/client";

export interface ChatRetrievalResponse {
  mode: string;
  query: string;
  message?: string;
  answer?: string;
  stats: {
    embedding_ms: number;
    retrieve_ms: number;
    context_ms: number;
    llm_ms?: number;
    total_ms: number;
    retrieved_count: number;
    context_count: number;
    llm_tokens?: number;
  };
  context: Array<{
    id: string;
    doc_id: string;
    chunk_id: string;
    text: string;
    score: number;
  }>;
  citations: Array<{
    doc_id: string;
    chunk_id: string;
    snippet: string;
  }>;
}

export async function postChat(
  question: string,
  workspace_id: string,
  role_id?: string,
  stream: boolean = false,
  show_think: boolean = false
): Promise<ChatRetrievalResponse> {
  const { data } = await apiClient.post<ChatRetrievalResponse>("/chat", {
    question,
    workspace_id,
    role_id,
    stream,
    show_think,
  });
  return data;
}
