import { FastifyInstance, FastifyReply } from "fastify";
import { generateChatResponse } from "../services/chatService.js";
import { sendTelegramMessage } from "../../../core/telegram-send.js";

interface TelegramEvent {
  account_id: string;
  user_id: string;
  peer_id: string;
  peer_type: "user" | "chat" | "channel";
  workspace_id: string | null;
  role_id: string | null;
  is_outgoing?: boolean; // Флаг для дополнительной проверки исходящих сообщений
  message: {
    id: string;
    text: string | null;
    senderId?: string;
    date: number;
  };
}

/**
 * POST /internal/tg-user/events - обработка событий от Telegram Listener
 * Внутренний endpoint, без аутентификации (доступен только внутри Docker сети)
 */
export async function handleTelegramEvent(
  fastify: FastifyInstance,
  request: any,
  reply: FastifyReply
) {
  try {
    const event: TelegramEvent = request.body;

    // Валидация входных данных
    if (!event.account_id || !event.user_id || !event.peer_id) {
      return reply.status(400).send({ error: "Missing required fields" });
    }

    // Дополнительная проверка: игнорируем исходящие сообщения (на всякий случай)
    // Основная проверка уже выполнена в listener и messageProcessor
    if (event.is_outgoing === true) {
      console.log(
        `⏭️  Пропущено исходящее сообщение для ${event.account_id}/${event.peer_id} (дополнительная проверка)`
      );
      return { success: true, skipped: true, reason: "outgoing_message" };
    }

    // Проверяем, что есть текст сообщения
    if (!event.message.text || event.message.text.trim().length === 0) {
      console.log(
        `⚠️  Сообщение без текста для ${event.account_id}/${event.peer_id}, пропускаем`
      );
      return { success: true, skipped: true, reason: "no_text" };
    }

    // Проверяем, что настроены workspace и role
    if (!event.workspace_id || !event.role_id) {
      console.log(
        `⚠️  Не настроены workspace или role для ${event.account_id}/${event.peer_id}, пропускаем`
      );
      return { success: true, skipped: true, reason: "not_configured" };
    }

    console.log(`🎯 Обработка события от Listener:`);
    console.log(`   Аккаунт: ${event.account_id}`);
    console.log(`   Чат: ${event.peer_id} (${event.peer_type})`);
    console.log(`   Сообщение: ${event.message.text}`);
    console.log(`   Workspace: ${event.workspace_id}`);
    console.log(`   Role: ${event.role_id}`);

    // Генерируем ответ через chat API
    const chatStart = Date.now();
    const chatResponse = await generateChatResponse(
      event.message.text,
      event.user_id,
      event.workspace_id,
      event.role_id
    );
    const chatTime = Date.now() - chatStart;

    if (!chatResponse.success) {
      console.error(
        `❌ Ошибка генерации ответа: ${chatResponse.error || "unknown"}`
      );
      return {
        success: false,
        error: chatResponse.error || "Chat generation failed",
      };
    }

    console.log(
      `✅ Ответ сгенерирован за ${chatTime}ms (${chatResponse.answer.length} символов)`
    );
    console.log("🧠 Ответ ассистента:");
    console.log(chatResponse.answer);

    // Пытаемся отправить ответ в Telegram
    try {
      await sendTelegramMessage(
        event.account_id,
        event.user_id,
        event.peer_id,
        event.peer_type,
        chatResponse.answer
      );
      console.log(
        `📤 Ответ отправлен в Telegram чат ${event.peer_id} (${event.peer_type})`
      );
    } catch (sendError: any) {
      console.error(
        `❌ Ошибка отправки ответа в Telegram: ${
          sendError instanceof Error ? sendError.message : String(sendError)
        }`
      );
      // Не падаем, автоответ мог сгенерироваться корректно
    }

    return {
      success: true,
      processed: true,
      answer: chatResponse.answer,
      stats: { chat_ms: chatTime },
    };
  } catch (error: any) {
    console.error("❌ Ошибка обработки Telegram события:", error);
    return reply.status(500).send({ error: "Internal server error" });
  }
}
