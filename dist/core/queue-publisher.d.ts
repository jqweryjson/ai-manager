export interface TelegramEventMessage {
    type: "send_message";
    integration: "telegram";
    account_id: string;
    user_id: string;
    peer_id: string;
    peer_type: "user" | "chat" | "channel";
    access_hash?: string | null;
    workspace_id: string | null;
    role_id: string | null;
    message_text: string;
}
export interface TelegramSendMessage {
    type: "send_message";
    integration: "telegram";
    account_id: string;
    user_id: string;
    peer_id: string;
    peer_type: "user" | "chat" | "channel";
    access_hash?: string | null;
    text: string;
    priority?: number;
    attempts?: number;
    max_attempts?: number;
}
export interface VkSendMessage {
    type: "send_message";
    integration: "vk";
    account_id: string;
    user_id: string;
    peer_id: string;
    peer_type: "user" | "chat" | "group";
    text: string;
    priority?: number;
    attempts?: number;
    max_attempts?: number;
}
/**
 * Опубликовать событие от Telegram Listener в очередь
 */
export declare function publishTelegramEvent(message: TelegramEventMessage): Promise<boolean>;
/**
 * Опубликовать задачу на отправку сообщения в Telegram
 */
export declare function publishTelegramSendMessage(message: TelegramSendMessage): Promise<boolean>;
/**
 * Опубликовать задачу на отправку сообщения в VK
 */
export declare function publishVkSendMessage(message: VkSendMessage): Promise<boolean>;
//# sourceMappingURL=queue-publisher.d.ts.map