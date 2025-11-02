import { FastifyInstance } from "fastify";
import multipart from "@fastify/multipart";
import { chunkText } from "../core/chunking.js";
import { AuthenticatedRequest } from "../middleware/auth.js";
import { getEmbeddingsBatch } from "../core/embeddings.js";
import {
  insertDocuments,
  MilvusDocument,
  listUserDocuments,
  deleteUserDocument,
} from "../core/milvus.js";
import {
  getWorkspace,
  ensureDefaultWorkspace,
} from "../core/workspace-postgres.js";

export async function ingestRoutes(fastify: FastifyInstance) {
  await fastify.register(multipart);

  fastify.post(
    "/ingest",
    { preHandler: (fastify as any).authenticate },
    async (request, reply) => {
      const req = request as AuthenticatedRequest;

      // Получаем файл из multipart/form-data
      const data = await request.file();

      if (!data) {
        return reply.status(400).send({ error: "No file uploaded" });
      }

      // Получаем workspace_id из fields
      const workspaceIdField = data.fields.workspace_id;
      const workspaceId =
        workspaceIdField &&
        typeof workspaceIdField === "object" &&
        "value" in workspaceIdField
          ? String(workspaceIdField.value)
          : undefined;

      if (!workspaceId) {
        return reply.status(400).send({ error: "workspace_id is required" });
      }

      // Проверка ownership workspace
      let workspace = await getWorkspace(workspaceId);
      if (!workspace || workspace.user_id !== req.userId) {
        // Если workspace не найден или не принадлежит пользователю, создаем дефолтный
        workspace = await ensureDefaultWorkspace(req.userId);
        console.log(`🔄 Created default workspace for user ${req.userId}`);
      }

      const startTime = Date.now();
      fastify.log.info(`📄 Начало загрузки файла: ${data.filename}`);
      fastify.log.info(`👤 Пользователь: ${req.userId}`);
      fastify.log.info(`🗂️  Workspace: ${workspace.id}`);

      // Читаем содержимое файла
      const buffer = await data.toBuffer();
      const text = buffer.toString("utf-8");

      if (!text || text.trim().length === 0) {
        fastify.log.warn(`⚠️  Файл пустой: ${data.filename}`);
        return reply.status(400).send({ error: "File is empty" });
      }

      fastify.log.info(`📊 Размер текста: ${text.length} символов`);

      const docId = `doc_${Date.now()}`;
      const source = data.filename;
      const chunks = chunkText(text, req.userId, docId, source);

      fastify.log.info(`✂️  Разбито на чанки: ${chunks.length} шт.`);

      try {
        // Milvus collection is initialized on server startup
        fastify.log.info(`🗄️  Milvus коллекция готова`);

        // Get embeddings for all chunks
        const texts = chunks.map(chunk => chunk.text);
        fastify.log.info(
          `🔄 Начало генерации embeddings для ${texts.length} чанков...`
        );
        const embeddingsStart = Date.now();
        const embeddings = await getEmbeddingsBatch(texts);
        const embeddingsTime = Date.now() - embeddingsStart;
        fastify.log.info(`✅ Embeddings сгенерированы за ${embeddingsTime}ms`);

        // Prepare documents for Milvus
        const documents: MilvusDocument[] = chunks.map((chunk, index) => {
          const embedding = embeddings[index];
          if (!embedding) {
            throw new Error(`Missing embedding for chunk ${index}`);
          }

          return {
            id: chunk.id,
            vector: embedding,
            user_id: req.userId,
            workspace_id: workspace.id,
            doc_id: docId,
            chunk_id: chunk.id,
            text: chunk.text,
          };
        });

        // Insert into Milvus
        fastify.log.info(
          `💾 Начало записи в Milvus: ${documents.length} документов...`
        );
        const insertStart = Date.now();
        await insertDocuments(documents);
        const insertTime = Date.now() - insertStart;
        fastify.log.info(`✅ Записано в Milvus за ${insertTime}ms`);

        const totalTime = Date.now() - startTime;
        fastify.log.info(`🎉 Загрузка завершена успешно за ${totalTime}ms`);
        fastify.log.info(
          `📋 Итого: ${chunks.length} чанков, ${documents.length} векторов`
        );

        return {
          doc_id: docId,
          chunks_count: chunks.length,
          indexed_count: documents.length,
          chunks: chunks.map(chunk => ({
            id: chunk.id,
            text_preview: chunk.text.substring(0, 100) + "...",
            metadata: chunk.metadata,
          })),
        };
      } catch (error) {
        const totalTime = Date.now() - startTime;
        fastify.log.error(`❌ Ошибка загрузки после ${totalTime}ms: ${error}`);
        return reply.status(500).send({
          error: "Failed to process document",
          doc_id: docId,
          chunks_count: chunks.length,
          indexed_count: 0,
        });
      }
    }
  );

  fastify.get(
    "/documents",
    { preHandler: (fastify as any).authenticate },
    async (request, reply) => {
      const req = request as AuthenticatedRequest;
      const workspaceId = (request.query as any)?.workspace_id as string;
      try {
        if (workspaceId) {
          // Проверка ownership workspace
          const ws = await getWorkspace(workspaceId);
          if (!ws || ws.user_id !== req.userId) {
            return reply
              .status(403)
              .send({ error: "Access denied to workspace" });
          }
        }
        // Milvus collection is initialized on server startup
        const docs = await listUserDocuments(req.userId, workspaceId);
        return { documents: docs };
      } catch (e) {
        fastify.log.error(e);
        return reply.status(500).send({ error: "Failed to list documents" });
      }
    }
  );

  // Удаление документа пользователя в workspace
  fastify.delete(
    "/documents/:docId",
    { preHandler: (fastify as any).authenticate },
    async (request, reply) => {
      const req = request as AuthenticatedRequest;
      const { docId } = request.params as { docId: string };
      const workspaceId = (request.query as any)?.workspace_id as string;

      if (!workspaceId) {
        return reply.status(400).send({ error: "workspace_id is required" });
      }

      // Проверка ownership workspace
      const workspace = await getWorkspace(workspaceId);
      if (!workspace || workspace.user_id !== req.userId) {
        return reply.status(403).send({ error: "Access denied to workspace" });
      }

      try {
        // Milvus collection is initialized on server startup
        const res = await deleteUserDocument(req.userId, workspaceId, docId);
        return res;
      } catch (e) {
        fastify.log.error(e);
        return reply.status(500).send({ error: "Failed to delete document" });
      }
    }
  );
}
