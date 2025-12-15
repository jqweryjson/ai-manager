/**
 * Конфигурация очередей для разных интеграций
 */
export type IntegrationType = "telegram" | "vk" | "whatsapp" | "slack" | "crm";
export interface QueueConfig {
    integration: IntegrationType;
    exchange: string;
    queues: {
        events: string;
        sendMessage: string;
    };
}
/**
 * Конфигурация очередей для Telegram
 */
export declare const TELEGRAM_QUEUE_CONFIG: QueueConfig;
/**
 * Конфигурация очередей для VK
 */
export declare const VK_QUEUE_CONFIG: QueueConfig;
/**
 * Получить конфигурацию очередей для интеграции
 */
export declare function getQueueConfig(integration: IntegrationType): QueueConfig;
/**
 * Получить все конфигурации очередей
 */
export declare function getAllQueueConfigs(): QueueConfig[];
//# sourceMappingURL=queue-config.d.ts.map