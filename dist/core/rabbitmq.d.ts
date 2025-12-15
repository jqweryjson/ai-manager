import type { AmqpConnectionManager, ChannelWrapper } from "amqp-connection-manager";
/**
 * Получить или создать подключение к RabbitMQ
 */
export declare function getRabbitMQConnection(): Promise<AmqpConnectionManager>;
/**
 * Получить или создать канал для работы с RabbitMQ
 */
export declare function getRabbitMQChannel(): Promise<ChannelWrapper>;
/**
 * Закрыть подключение к RabbitMQ
 */
export declare function closeRabbitMQConnection(): Promise<void>;
//# sourceMappingURL=rabbitmq.d.ts.map