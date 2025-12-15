import { generateChatResponse } from "../services/chatService.js";
import { publishTelegramSendMessage } from "../../../core/queue-publisher.js";
import { canSendMessage } from "../../../core/telegram-account-postgres.js";
/**
 * POST /internal/tg-user/events - обработка событий от Telegram Listener
 * Внутренний endpoint, без аутентификации (доступен только внутри Docker сети)
 */
export async function handleTelegramEvent(fastify, request, reply) {
    try {
        const event = request.body;
        // Валидация входных данных
        if (!event.account_id || !event.user_id || !event.peer_id) {
            return reply.status(400).send({ error: "Missing required fields" });
        }
        // Дополнительная проверка: игнорируем исходящие сообщения (на всякий случай)
        // Основная проверка уже выполнена в listener и messageProcessor
        if (event.is_outgoing === true) {
            console.log(`⏭️  Пропущено исходящее сообщение для ${event.account_id}/${event.peer_id} (дополнительная проверка)`);
            return { success: true, skipped: true, reason: "outgoing_message" };
        }
        // Проверяем, что есть текст сообщения
        if (!event.message.text || event.message.text.trim().length === 0) {
            console.log(`⚠️  Сообщение без текста для ${event.account_id}/${event.peer_id}, пропускаем`);
            return { success: true, skipped: true, reason: "no_text" };
        }
        // Проверяем, что настроены workspace и role
        if (!event.workspace_id || !event.role_id) {
            console.log(`⚠️  Не настроены workspace или role для ${event.account_id}/${event.peer_id}, пропускаем`);
            return { success: true, skipped: true, reason: "not_configured" };
        }
        // Проверяем, можно ли отправить сообщение в этот чат (проверка FLOOD_WAIT)
        const canSend = await canSendMessage(event.account_id, event.peer_id);
        if (!canSend) {
            console.log(`⏸️  Чат ${event.account_id}/${event.peer_id} заблокирован (FLOOD_WAIT). Пропускаем генерацию ответа, чтобы не тратить LLM токены.`);
            return {
                success: true,
                skipped: true,
                reason: "flood_wait",
                message: "Chat is blocked by Telegram FLOOD_WAIT",
            };
        }
        console.log(`🎯 Обработка события от Listener:`);
        console.log(`   Аккаунт: ${event.account_id}`);
        console.log(`   Чат: ${event.peer_id} (${event.peer_type})`);
        console.log(`   Access Hash: ${event.access_hash || "null"}`);
        console.log(`   Сообщение: ${event.message.text}`);
        console.log(`   Workspace: ${event.workspace_id}`);
        console.log(`   Role: ${event.role_id}`);
        // Генерируем ответ через chat API
        const chatStart = Date.now();
        const chatResponse = await generateChatResponse(event.message.text, event.user_id, event.workspace_id, event.role_id);
        const chatTime = Date.now() - chatStart;
        if (!chatResponse.success) {
            console.error(`❌ Ошибка генерации ответа: ${chatResponse.error || "unknown"}`);
            return {
                success: false,
                error: chatResponse.error || "Chat generation failed",
            };
        }
        console.log(`✅ Ответ сгенерирован за ${chatTime}ms (${chatResponse.answer.length} символов)`);
        console.log("🧠 Ответ ассистента:");
        console.log(chatResponse.answer);
        // Публикуем задачу на отправку в RabbitMQ вместо прямого вызова
        try {
            const published = await publishTelegramSendMessage({
                type: "send_message",
                integration: "telegram",
                account_id: event.account_id,
                user_id: event.user_id,
                peer_id: event.peer_id,
                peer_type: event.peer_type,
                access_hash: event.access_hash || null,
                text: chatResponse.answer,
                priority: 1, // normal priority
                attempts: 0,
                max_attempts: 3,
            });
            if (published) {
                console.log(`📤 Задача на отправку опубликована в RabbitMQ для чата ${event.peer_id} (${event.peer_type})`);
            }
            else {
                console.error(`❌ Не удалось опубликовать задачу в RabbitMQ для ${event.account_id}/${event.peer_id}`);
            }
        }
        catch (publishError) {
            console.error(`❌ Ошибка публикации задачи в RabbitMQ: ${publishError instanceof Error
                ? publishError.message
                : String(publishError)}`);
            // Не падаем, автоответ мог сгенерироваться корректно
        }
        return {
            success: true,
            processed: true,
            answer: chatResponse.answer,
            stats: { chat_ms: chatTime },
        };
    }
    catch (error) {
        console.error("❌ Ошибка обработки Telegram события:", error);
        return reply.status(500).send({ error: "Internal server error" });
    }
}
//# sourceMappingURL=events.js.map