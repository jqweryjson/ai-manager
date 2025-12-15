/**
 * VK API клиент для работы с VK API
 */
export interface VkApiResponse<T> {
    response?: T;
    error?: {
        error_code: number;
        error_msg: string;
        request_params?: Array<{
            key: string;
            value: string;
        }>;
    };
}
export interface VkUser {
    id: number;
    first_name: string;
    last_name: string;
    photo_200?: string;
    photo_100?: string;
}
export interface VkLongPollServer {
    key: string;
    server: string;
    ts: string;
}
export interface VkLongPollResponse {
    ts: string;
    updates: Array<Array<unknown>>;
}
export interface VkConversation {
    peer: {
        id: number;
        type: string;
        local_id?: number;
    };
    last_message_id: number;
    in_read: number;
    out_read: number;
    sort_id: {
        major_id: number;
        minor_id: number;
    };
    last_conversation_message_id: number;
    important: boolean;
    unanswered: boolean;
    push_settings: {
        sound: number;
        disabled_until: number;
    };
    can_write: {
        allowed: boolean;
        reason?: number;
    };
    chat_settings?: {
        title: string;
        members_count: number;
        state: string;
        photo?: {
            photo_200?: string;
        };
    };
}
/**
 * Создание клиента VK API
 */
export declare function createVkApiClient(accessToken: string): {
    /**
     * Выполнение запроса к VK API
     */
    request<T>(method: string, params: Record<string, string | number | boolean>): Promise<T>;
};
/**
 * Получение Long Poll сервера
 */
export declare function getLongPollServer(accessToken: string): Promise<VkLongPollServer>;
/**
 * Выполнение Long Poll запроса
 */
export declare function longPoll(server: string, key: string, ts: string, wait?: number): Promise<VkLongPollResponse>;
/**
 * Отправка сообщения
 */
export declare function sendMessage(accessToken: string, peerId: number, text: string, randomId?: number): Promise<number>;
/**
 * Получение списка диалогов
 */
export declare function getConversations(accessToken: string, offset?: number, count?: number): Promise<{
    count: number;
    items: VkConversation[];
}>;
/**
 * Получение информации о пользователях
 */
export declare function getUserInfo(accessToken: string, userIds: number[]): Promise<VkUser[]>;
//# sourceMappingURL=vk-api.d.ts.map