/**
 * Результат отправки сообщения
 */
export interface SendTelegramMessageResult {
    success: boolean;
    floodWaitSeconds?: number | null;
    error?: string;
}
/**
 * Отправка сообщения в Telegram от имени user-бота
 */
export declare function sendTelegramMessage(accountId: string, userId: string, peerId: string, peerType: "user" | "chat" | "channel", text: string, accessHash?: string | null): Promise<SendTelegramMessageResult>;
//# sourceMappingURL=telegram-send.d.ts.map