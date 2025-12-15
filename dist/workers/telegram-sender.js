import { getRabbitMQChannel } from "../core/rabbitmq.js";
import { getQueueConfig } from "../core/queue-config.js";
import { sendTelegramMessage, } from "../core/telegram-send.js";
import { updateNextAllowedAt, canSendMessage, } from "../core/telegram-account-postgres.js";
const TELEGRAM_CONFIG = getQueueConfig("telegram");
// Базовая задержка между успешными отправками в один чат (в секундах)
const BASE_DELAY_SECONDS = 3;
async function handleMessage(channel, msg) {
    if (!msg) {
        return;
    }
    try {
        const content = msg.content.toString("utf8");
        const payload = JSON.parse(content);
        console.log(`📥 [telegram-sender] Получена задача: ${payload.account_id}/${payload.peer_id}`);
        // Дополнительная проверка: можно ли отправить сообщение в этот чат сейчас
        const canSend = await canSendMessage(payload.account_id, payload.peer_id);
        if (!canSend) {
            console.log(`⏸️  [telegram-sender] Чат ${payload.account_id}/${payload.peer_id} ещё заблокирован (FLOOD_WAIT). Пропускаем задачу.`);
            channel.ack(msg);
            return;
        }
        const result = await sendTelegramMessage(payload.account_id, payload.user_id, payload.peer_id, payload.peer_type, payload.text, payload.access_hash);
        if (result.success) {
            // Успешная отправка → ставим небольшую базовую задержку
            await updateNextAllowedAt(payload.account_id, payload.peer_id, BASE_DELAY_SECONDS);
            console.log(`✅ [telegram-sender] Сообщение отправлено, next_allowed_at обновлён на +${BASE_DELAY_SECONDS} сек`);
            channel.ack(msg);
            return;
        }
        // FLOOD_WAIT — обновляем next_allowed_at
        if (result.floodWaitSeconds && result.floodWaitSeconds > 0) {
            await updateNextAllowedAt(payload.account_id, payload.peer_id, result.floodWaitSeconds);
            console.log(`⏸️  [telegram-sender] FLOOD_WAIT для ${payload.account_id}/${payload.peer_id}: ${result.floodWaitSeconds} сек. Обновлён next_allowed_at.`);
            // Задачу считаем обработанной — повторно не отправляем, ждём следующих событий
            channel.ack(msg);
            return;
        }
        // Другая ошибка
        console.error(`❌ [telegram-sender] Ошибка отправки сообщения для ${payload.account_id}/${payload.peer_id}: ${result.error || "unknown"}`);
        channel.ack(msg);
    }
    catch (error) {
        console.error("❌ [telegram-sender] Ошибка обработки сообщения:", error);
        // Чтобы не зациклиться, ACK даже при ошибке парсинга
        channel.ack(msg);
    }
}
async function startTelegramSender() {
    console.log("🚀 Запуск Telegram Sender worker...");
    const channelWrapper = await getRabbitMQChannel();
    // channelWrapper предоставляет логический канал — получаем реальный канал внутри setup
    await channelWrapper.addSetup(async (channel) => {
        const queueName = TELEGRAM_CONFIG.queues.sendMessage;
        // На всякий случай убеждаемся, что очередь существует,
        // даже если базовый setup в rabbitmq.ts ещё не отработал
        await channel.assertQueue(queueName, { durable: true });
        await channel.consume(queueName, msg => {
            // Оборачиваем в async, но не ждём — обработка идёт в фоне
            void handleMessage(channel, msg);
        }, {
            noAck: false, // управляем подтверждениями вручную
        });
        console.log(`✅ [telegram-sender] Подписан на очередь ${queueName} (exchange: ${TELEGRAM_CONFIG.exchange})`);
    });
}
// Запуск worker'а, если файл запущен напрямую
if (import.meta.url === `file://${process.argv[1]}`) {
    startTelegramSender().catch(error => {
        console.error("💥 Критическая ошибка в telegram-sender:", error);
        process.exit(1);
    });
}
//# sourceMappingURL=telegram-sender.js.map