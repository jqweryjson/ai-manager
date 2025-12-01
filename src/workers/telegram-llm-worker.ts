import { getRabbitMQChannel } from "../core/rabbitmq.js";
import { getQueueConfig } from "../core/queue-config.js";
import type { ConfirmChannel, ConsumeMessage } from "amqplib";

import type { TelegramEventMessage } from "../core/queue-publisher.js";
import { publishTelegramSendMessage } from "../core/queue-publisher.js";
import { generateChatResponse } from "../api/telegram-user/services/chatService.js";
import { canSendMessage } from "../core/telegram-account-postgres.js";

const TELEGRAM_CONFIG = getQueueConfig("telegram");

async function handleMessage(
  channel: ConfirmChannel,
  msg: ConsumeMessage | null
): Promise<void> {
  if (!msg) return;

  try {
    const content = msg.content.toString("utf8");
    const payload: TelegramEventMessage = JSON.parse(content);

    console.log(
      `📥 [telegram-llm-worker] Получено событие: ${payload.account_id}/${payload.peer_id}`
    );

    // Базовая валидация
    if (
      !payload.message_text ||
      payload.message_text.trim().length === 0 ||
      !payload.workspace_id ||
      !payload.role_id
    ) {
      console.log(
        `⚠️  [telegram-llm-worker] Некорректное событие (нет текста или workspace/role), пропускаем: ${payload.account_id}/${payload.peer_id}`
      );
      channel.ack(msg);
      return;
    }

    // Проверяем, можно ли сейчас отправлять в этот чат (FLOOD_WAIT)
    const canSend = await canSendMessage(payload.account_id, payload.peer_id);
    if (!canSend) {
      console.log(
        `⏸️  [telegram-llm-worker] Чат ${payload.account_id}/${payload.peer_id} заблокирован (FLOOD_WAIT). Пропускаем генерацию ответа.`
      );
      channel.ack(msg);
      return;
    }

    // Генерация ответа через chat API
    const chatStart = Date.now();
    const chatResponse = await generateChatResponse(
      payload.message_text,
      payload.user_id,
      payload.workspace_id,
      payload.role_id
    );
    const chatTime = Date.now() - chatStart;

    if (!chatResponse.success) {
      console.error(
        `❌ [telegram-llm-worker] Ошибка генерации ответа: ${
          chatResponse.error || "unknown"
        }`
      );
      channel.ack(msg);
      return;
    }

    console.log(
      `✅ [telegram-llm-worker] Ответ сгенерирован за ${chatTime}ms (${chatResponse.answer.length} символов)`
    );

    // Публикуем задачу на отправку в очередь telegram.send_message
    const published = await publishTelegramSendMessage({
      type: "send_message",
      integration: "telegram",
      account_id: payload.account_id,
      user_id: payload.user_id,
      peer_id: payload.peer_id,
      peer_type: payload.peer_type,
      access_hash: payload.access_hash || null,
      text: chatResponse.answer,
      priority: 1,
      attempts: 0,
      max_attempts: 3,
    });

    if (published) {
      console.log(
        `📤 [telegram-llm-worker] Задача на отправку опубликована для ${payload.account_id}/${payload.peer_id}`
      );
    } else {
      console.error(
        `❌ [telegram-llm-worker] Не удалось опубликовать задачу на отправку для ${payload.account_id}/${payload.peer_id}`
      );
    }

    channel.ack(msg);
  } catch (error) {
    console.error("❌ [telegram-llm-worker] Ошибка обработки события:", error);
    // Чтобы не зациклиться, подтверждаем сообщение даже при ошибке
    channel.ack(msg);
  }
}

async function startTelegramLLMWorker(): Promise<void> {
  console.log("🚀 Запуск Telegram LLM Worker...");

  const channelWrapper = await getRabbitMQChannel();

  await channelWrapper.addSetup(async (channel: ConfirmChannel) => {
    const queueName = TELEGRAM_CONFIG.queues.events;

    // На всякий случай убеждаемся, что очередь существует,
    // даже если базовый setup в rabbitmq.ts ещё не отработал
    await channel.assertQueue(queueName, { durable: true });

    await channel.consume(
      queueName,
      msg => {
        void handleMessage(channel, msg);
      },
      { noAck: false }
    );

    console.log(
      `✅ [telegram-llm-worker] Подписан на очередь ${queueName} (exchange: ${TELEGRAM_CONFIG.exchange})`
    );
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  startTelegramLLMWorker().catch(error => {
    console.error("💥 Критическая ошибка в telegram-llm-worker:", error);
    process.exit(1);
  });
}
