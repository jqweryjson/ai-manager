import type { TelegramEvent } from "./types.js";
export declare class MessageProcessor {
    buildEvent(accountId: string, userId: string, peerId: string, message: any): Promise<TelegramEvent | null>;
    extractPeerId(peer: any): string | null;
}
//# sourceMappingURL=messageProcessor.d.ts.map