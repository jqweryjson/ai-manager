import amqp from "amqp-connection-manager";
import { getAllQueueConfigs } from "./queue-config.js";
const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://admin:admin123@localhost:5672";
let connection = null;
let channelWrapper = null;
/**
 * Получить или создать подключение к RabbitMQ
 */
export async function getRabbitMQConnection() {
    if (connection) {
        return connection;
    }
    connection = amqp.connect([RABBITMQ_URL], {
        reconnectTimeInSeconds: 5,
    });
    connection.on("connect", () => {
        console.log("✅ Подключено к RabbitMQ");
    });
    connection.on("disconnect", (params) => {
        console.error("❌ Отключено от RabbitMQ:", params.err?.message);
    });
    connection.on("connectFailed", (params) => {
        console.error("❌ Ошибка подключения к RabbitMQ:", params.err?.message);
    });
    return connection;
}
/**
 * Получить или создать канал для работы с RabbitMQ
 */
export async function getRabbitMQChannel() {
    if (channelWrapper) {
        return channelWrapper;
    }
    const conn = await getRabbitMQConnection();
    channelWrapper = conn.createChannel({
        setup: async (channel) => {
            // Получаем все конфигурации очередей для всех интеграций
            const configs = getAllQueueConfigs();
            // Создаём exchange и очереди для каждой интеграции
            for (const config of configs) {
                // Создаём exchange
                await channel.assertExchange(config.exchange, "direct", {
                    durable: true,
                });
                // Создаём очереди
                await channel.assertQueue(config.queues.events, {
                    durable: true,
                });
                await channel.assertQueue(config.queues.sendMessage, {
                    durable: true,
                });
                // Привязываем очереди к exchange
                await channel.bindQueue(config.queues.events, config.exchange, config.queues.events);
                await channel.bindQueue(config.queues.sendMessage, config.exchange, config.queues.sendMessage);
                console.log(`✅ Настроены очереди для интеграции: ${config.integration}`);
            }
            console.log("✅ Все RabbitMQ exchange и очереди настроены");
        },
    });
    return channelWrapper;
}
/**
 * Закрыть подключение к RabbitMQ
 */
export async function closeRabbitMQConnection() {
    if (channelWrapper) {
        await channelWrapper.close();
        channelWrapper = null;
    }
    if (connection) {
        await connection.close();
        connection = null;
    }
    console.log("✅ Подключение к RabbitMQ закрыто");
}
//# sourceMappingURL=rabbitmq.js.map