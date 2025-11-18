import { z } from "zod";
import { getEmbeddings } from "../core/embeddings.js";
import { searchSimilar } from "../core/milvus.js";
import { buildContextFromRetrieved } from "../core/context.js";
import { getWorkspace } from "../core/workspace-postgres.js";
import { callGroqLLM } from "../core/groq.js";
import { withPostgres } from "../core/postgres.js";
// RAG параметры из env или дефолт
const RAG_TOP_K = Number(process.env.RAG_TOP_K) || 50;
const RAG_EF = Number(process.env.RAG_EF) || 200;
const RAG_MAX_CHUNKS_TOTAL = Number(process.env.RAG_MAX_CHUNKS_TOTAL) || 14;
const RAG_MAX_CHUNKS_PER_DOC = Number(process.env.RAG_MAX_CHUNKS_PER_DOC) || 5;
const RAG_MAX_CHARS_TOTAL = Number(process.env.RAG_MAX_CHARS_TOTAL) || 8000;
const MAX_CONTEXT_CHARS = Number(process.env.MAX_CONTEXT_CHARS) || 12000;
const ChatSchema = z.object({
    question: z.string().min(1),
    workspace_id: z.string().min(1),
    role_id: z.string().optional(),
    stream: z.boolean().optional().default(false),
    show_think: z.boolean().optional().default(false),
});
export async function chatRoutes(fastify) {
    fastify.post("/chat", { preHandler: fastify.authenticate }, async (request, reply) => {
        const req = request;
        const body = ChatSchema.parse(request.body);
        // Проверка ownership workspace
        const workspace = await getWorkspace(body.workspace_id);
        if (!workspace || workspace.user_id !== req.userId) {
            return reply.status(403).send({ error: "Access denied to workspace" });
        }
        // Получение роли ассистента (если указана)
        let assistantRole = null;
        if (body.role_id) {
            assistantRole = await withPostgres(async (client) => {
                const result = await client.query("SELECT id, name, prompt FROM roles WHERE id = $1 AND user_id = $2", [body.role_id, req.userId]);
                if (result.rows.length === 0) {
                    return null;
                }
                const row = result.rows[0];
                return {
                    id: row.id,
                    name: row.name,
                    prompt: row.prompt,
                };
            });
            if (!assistantRole) {
                return reply.status(404).send({ error: "Role not found" });
            }
            fastify.log.info(`🎭 Роль ассистента: ${assistantRole.name}`);
        }
        const t0 = Date.now();
        fastify.log.info(`💬 Вопрос: ${body.question}`);
        fastify.log.info(`👤 Пользователь: ${req.userId}`);
        fastify.log.info(`🗂️  Workspace: ${body.workspace_id}`);
        try {
            // 1) Embedding для запроса
            fastify.log.info("🧮 Генерация embedding для запроса...");
            const eStart = Date.now();
            const queryVector = await getEmbeddings(body.question);
            const eTime = Date.now() - eStart;
            fastify.log.info(`✅ Embedding готов за ${eTime}ms`);
            // 2) Поиск похожих чанков в Milvus
            fastify.log.info("🔎 Поиск похожих фрагментов в Milvus...");
            const rStart = Date.now();
            const milvusRes = await searchSimilar(queryVector, req.userId, body.workspace_id, RAG_TOP_K);
            const rTime = Date.now() - rStart;
            fastify.log.info(`✅ Найдено кандидатов: ${milvusRes.length} за ${rTime}ms`);
            // Приведение результатов к унифицированному формату
            const retrieved = (milvusRes || []).map((r) => ({
                id: r.id,
                docId: r.doc_id,
                chunkId: r.chunk_id,
                text: r.text,
                score: typeof r.score === "number" ? r.score : (r.distance ?? 0),
            }));
            // 3) Построение контекста (dedup/diversify/budget)
            const ctxStart = Date.now();
            const built = buildContextFromRetrieved(retrieved, {
                maxChunksTotal: 14,
                maxChunksPerDoc: 5,
                maxCharsTotal: MAX_CONTEXT_CHARS,
            });
            const ctxTime = Date.now() - ctxStart;
            fastify.log.info(`🧱 Контекст: ${built.usage.chunks} чанков, ${built.usage.docs} доков, ${built.usage.chars} симв., за ${ctxTime}ms`);
            // 4) Вызов Groq LLM
            fastify.log.info("🤖 Вызов Groq LLM...");
            const llmStart = Date.now();
            // Преобразуем контекст в строку
            const contextString = built.context
                .map((chunk, index) => `[${index + 1}] ${chunk.text}`)
                .join("\n\n");
            const llmResponse = await callGroqLLM(body.question, contextString, assistantRole?.prompt, undefined, { includeThink: body.show_think });
            const llmTime = Date.now() - llmStart;
            fastify.log.info(`✅ LLM ответ готов за ${llmTime}ms`);
            const total = Date.now() - t0;
            // Возвращаем полный ответ с LLM
            const response = {
                mode: "rag-complete",
                query: body.question,
                answer: llmResponse.answer,
                stats: {
                    embedding_ms: eTime,
                    retrieve_ms: rTime,
                    context_ms: ctxTime,
                    llm_ms: llmTime,
                    total_ms: total,
                    retrieved_count: retrieved.length,
                    context_count: built.usage.chunks,
                    llm_tokens: llmResponse.usage?.total_tokens || 0,
                },
                context: built.context,
                citations: built.citations,
            };
            if (body.stream) {
                reply.type("application/json; charset=utf-8");
                return reply.send(response);
            }
            return response;
        }
        catch (err) {
            fastify.log.error(`❌ Ошибка чата: ${err}`);
            return reply.status(500).send({ error: "Chat failed" });
        }
    });
}
//# sourceMappingURL=chat.js.map