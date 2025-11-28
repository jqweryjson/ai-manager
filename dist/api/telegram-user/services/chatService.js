import { getEmbeddings } from "../../../core/embeddings.js";
import { searchSimilar } from "../../../core/milvus.js";
import { buildContextFromRetrieved } from "../../../core/context.js";
import { getWorkspace } from "../../../core/workspace-postgres.js";
import { callGroqLLM } from "../../../core/groq.js";
import { withPostgres } from "../../../core/postgres.js";
// RAG параметры из env или дефолт (те же, что в chat.ts)
const RAG_TOP_K = Number(process.env.RAG_TOP_K);
const MAX_CONTEXT_CHARS = Number(process.env.MAX_CONTEXT_CHARS);
/**
 * Генерирует ответ на вопрос используя RAG pipeline
 * @param question - вопрос пользователя
 * @param userId - ID пользователя
 * @param workspaceId - ID workspace
 * @param roleId - опциональный ID роли ассистента
 * @returns ответ от LLM или ошибка
 */
export async function generateChatResponse(question, userId, workspaceId, roleId) {
    try {
        // Проверка ownership workspace
        const workspace = await getWorkspace(workspaceId);
        if (!workspace || workspace.user_id !== userId) {
            return {
                answer: "",
                success: false,
                error: "Access denied to workspace",
            };
        }
        // Получение роли ассистента (если указана)
        let assistantRole = null;
        if (roleId) {
            assistantRole = await withPostgres(async (client) => {
                const result = await client.query("SELECT id, name, prompt FROM roles WHERE id = $1 AND user_id = $2", [roleId, userId]);
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
                return {
                    answer: "",
                    success: false,
                    error: "Role not found",
                };
            }
        }
        // 1) Embedding для запроса
        const queryVector = await getEmbeddings(question);
        // 2) Поиск похожих чанков в Milvus
        const milvusRes = await searchSimilar(queryVector, userId, workspaceId, RAG_TOP_K);
        // Приведение результатов к унифицированному формату
        const retrieved = (milvusRes || []).map((r) => ({
            id: r.id,
            docId: r.doc_id,
            chunkId: r.chunk_id,
            text: r.text,
            score: typeof r.score === "number" ? r.score : (r.distance ?? 0),
        }));
        // 3) Построение контекста (dedup/diversify/budget)
        const built = buildContextFromRetrieved(retrieved, {
            maxChunksTotal: 14,
            maxChunksPerDoc: 5,
            maxCharsTotal: MAX_CONTEXT_CHARS,
        });
        // 4) Вызов Groq LLM
        // Преобразуем контекст в строку
        const contextString = built.context
            .map((chunk, index) => `[${index + 1}] ${chunk.text}`)
            .join("\n\n");
        const llmResponse = await callGroqLLM(question, contextString, assistantRole?.prompt, undefined, { includeThink: false });
        return {
            answer: llmResponse.answer,
            success: true,
        };
    }
    catch (error) {
        console.error("❌ Ошибка генерации ответа:", error);
        return {
            answer: "",
            success: false,
            error: error.message || "Chat generation failed",
        };
    }
}
//# sourceMappingURL=chatService.js.map