/**
 * Результат отправки сообщения
 */
export interface SendVkMessageResult {
    success: boolean;
    rateLimitSeconds?: number | null;
    error?: string;
}
/**
 * Отправка сообщения в VK
 */
export declare function sendVkMessage(accountId: string, userId: string, peerId: string, peerType: "user" | "chat" | "group", text: string): Promise<SendVkMessageResult>;
//# sourceMappingURL=vk-send.d.ts.map