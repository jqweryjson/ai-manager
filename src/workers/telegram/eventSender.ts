import type { TelegramEvent } from "./types.js";
import { publishTelegramEvent } from "../../core/queue-publisher.js";

export class EventSender {
  /**
   * Отправка события в очередь RabbitMQ (telegram.events)
   */
  async send(event: TelegramEvent): Promise<void> {
    try {
      const published = await publishTelegramEvent({
        type: "send_message",
        integration: "telegram",
        account_id: event.account_id,
        user_id: event.user_id,
        peer_id: event.peer_id,
        peer_type: event.peer_type,
        access_hash: event.access_hash ?? null,
        workspace_id: event.workspace_id,
        role_id: event.role_id,
        message_text: event.message.text ?? "",
      });

      if (!published) {
        console.error(
          `❌ Не удалось опубликовать событие в RabbitMQ для ${event.account_id}/${event.peer_id}`
        );
      }
    } catch (error) {
      console.error(`❌ Ошибка отправки события в RabbitMQ:`, error);
    }
  }
}
