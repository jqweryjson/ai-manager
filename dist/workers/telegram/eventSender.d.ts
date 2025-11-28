import type { TelegramEvent } from "./types.js";
export declare class EventSender {
    private backendUrl;
    constructor();
    send(event: TelegramEvent): Promise<void>;
}
//# sourceMappingURL=eventSender.d.ts.map