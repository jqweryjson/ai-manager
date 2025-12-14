/**
 * Конфигурация очередей для разных интеграций
 */

export type IntegrationType = "telegram" | "vk" | "whatsapp" | "slack" | "crm";

export interface QueueConfig {
  integration: IntegrationType;
  exchange: string;
  queues: {
    events: string; // Очередь для событий от listener'а
    sendMessage: string; // Очередь для отправки сообщений
  };
}

/**
 * Конфигурация очередей для Telegram
 */
export const TELEGRAM_QUEUE_CONFIG: QueueConfig = {
  integration: "telegram",
  exchange: "telegram_events",
  queues: {
    events: "telegram.events",
    sendMessage: "telegram.send_message",
  },
};

/**
 * Конфигурация очередей для VK
 */
export const VK_QUEUE_CONFIG: QueueConfig = {
  integration: "vk",
  exchange: "vk_events",
  queues: {
    events: "vk.events",
    sendMessage: "vk.send_message",
  },
};

/**
 * Получить конфигурацию очередей для интеграции
 */
export function getQueueConfig(integration: IntegrationType): QueueConfig {
  switch (integration) {
    case "telegram":
      return TELEGRAM_QUEUE_CONFIG;
    case "vk":
      return VK_QUEUE_CONFIG;
    // TODO: Добавить конфигурации для других интеграций
    // case "whatsapp":
    //   return WHATSAPP_QUEUE_CONFIG;
    default:
      throw new Error(`Unknown integration: ${integration}`);
  }
}

/**
 * Получить все конфигурации очередей
 */
export function getAllQueueConfigs(): QueueConfig[] {
  return [TELEGRAM_QUEUE_CONFIG, VK_QUEUE_CONFIG];
}
