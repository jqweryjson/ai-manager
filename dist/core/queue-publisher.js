import { getRabbitMQChannel } from "./rabbitmq.js";
import { getQueueConfig } from "./queue-config.js";
/**
 * Опубликовать событие от Telegram Listener в очередь
 */
export async function publishTelegramEvent(message) {
    try {
        const channel = await getRabbitMQChannel();
        const config = getQueueConfig("telegram");
        const routingKey = config.queues.events;
        const content = Buffer.from(JSON.stringify(message));
        const published = await channel.publish(config.exchange, routingKey, content, {
            persistent: true, // Сохранять сообщения на диск
        });
        if (published) {
            console.log(`📤 Опубликовано событие в RabbitMQ: ${routingKey} для ${message.account_id}/${message.peer_id}`);
            return true;
        }
        else {
            console.error(`❌ Не удалось опубликовать событие в RabbitMQ: ${routingKey}`);
            return false;
        }
    }
    catch (error) {
        console.error("❌ Ошибка публикации события в RabbitMQ:", error);
        return false;
    }
}
/**
 * Опубликовать задачу на отправку сообщения в Telegram
 */
export async function publishTelegramSendMessage(message) {
    try {
        const channel = await getRabbitMQChannel();
        const config = getQueueConfig("telegram");
        const routingKey = config.queues.sendMessage;
        const content = Buffer.from(JSON.stringify(message));
        const published = await channel.publish(config.exchange, routingKey, content, {
            persistent: true,
            priority: message.priority || 1,
        });
        if (published) {
            console.log(`📤 Опубликована задача на отправку в RabbitMQ: ${routingKey} для ${message.account_id}/${message.peer_id}`);
            return true;
        }
        else {
            console.error(`❌ Не удалось опубликовать задачу в RabbitMQ: ${routingKey}`);
            return false;
        }
    }
    catch (error) {
        console.error("❌ Ошибка публикации задачи в RabbitMQ:", error);
        return false;
    }
}
/**
 * Опубликовать задачу на отправку сообщения в VK
 */
export async function publishVkSendMessage(message) {
    try {
        const channel = await getRabbitMQChannel();
        const config = getQueueConfig("vk");
        const routingKey = config.queues.sendMessage;
        const content = Buffer.from(JSON.stringify(message));
        const published = await channel.publish(config.exchange, routingKey, content, {
            persistent: true,
            priority: message.priority || 1,
        });
        if (published) {
            console.log(`📤 Опубликована задача на отправку в RabbitMQ: ${routingKey} для ${message.account_id}/${message.peer_id}`);
            return true;
        }
        else {
            console.error(`❌ Не удалось опубликовать задачу в RabbitMQ: ${routingKey}`);
            return false;
        }
    }
    catch (error) {
        console.error("❌ Ошибка публикации задачи в RabbitMQ:", error);
        return false;
    }
}
//# sourceMappingURL=queue-publisher.js.map