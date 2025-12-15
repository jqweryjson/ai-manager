import type { TelegramEvent } from "./types.js";
export declare class EventSender {
    /**
     * Отправка события в очередь RabbitMQ (telegram.events)
     */
    send(event: TelegramEvent): Promise<void>;
}
//# sourceMappingURL=eventSender.d.ts.map