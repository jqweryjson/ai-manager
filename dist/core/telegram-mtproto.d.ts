import { TelegramClient } from "telegram";
type DialogSummary = {
    peer_id: string;
    peer_type: "user" | "chat" | "channel";
    title: string;
    unread_count: number;
    access_hash?: string | null;
};
type GetDialogsResult = {
    dialogs: DialogSummary[];
    hasMore: boolean;
    nextOffsetDate?: string;
};
/**
 * Создаёт новый TelegramClient
 * @param apiId - API ID из my.telegram.org
 * @param apiHash - API Hash из my.telegram.org
 * @param sessionString - опциональная строка сессии для восстановления
 * @returns TelegramClient
 */
export declare function createClient(apiId: number, apiHash: string, sessionString?: string): TelegramClient;
/**
 * Отправляет код авторизации на телефон
 * @param client - TelegramClient
 * @param phone - номер телефона в международном формате
 * @returns phoneCodeHash для последующей авторизации
 */
export declare function sendCode(client: TelegramClient, phone: string): Promise<string>;
/**
 * Авторизуется по коду
 * @param client - TelegramClient
 * @param phone - номер телефона
 * @param code - код из Telegram
 * @param phoneCodeHash - hash из sendCode
 * @returns результат авторизации
 */
export declare function signIn(client: TelegramClient, phone: string, code: string, phoneCodeHash: string): Promise<{
    success: boolean;
    requires2FA: boolean;
}>;
/**
 * Завершает авторизацию с 2FA паролем
 * @param client - TelegramClient
 * @param password - пароль 2FA
 */
export declare function signInWithPassword(client: TelegramClient, password: string): Promise<void>;
/**
 * Получает строку сессии для сохранения
 * @param client - TelegramClient
 * @returns строка сессии
 */
export declare function getSessionString(client: TelegramClient): string;
/**
 * Восстанавливает клиент из строки сессии
 * @param sessionString - строка сессии
 * @param apiId - API ID
 * @param apiHash - API Hash
 * @returns TelegramClient
 */
export declare function restoreSession(sessionString: string, apiId: number, apiHash: string): TelegramClient;
/**
 * Загружает список диалогов (личные, группы, каналы) с пагинацией
 * Возвращает упрощённое представление для UI.
 */
export declare function getDialogsSummary(client: TelegramClient, limit?: number, offsetDate?: Date): Promise<GetDialogsResult>;
/**
 * Поиск контактов по имени
 */
export declare function getUserContacts(client: TelegramClient): Promise<DialogSummary[]>;
/**
 * Поиск чатов/групп/каналов по названию (фильтрация из всех диалогов)
 */
export declare function getUserDialogs(client: TelegramClient, limit?: number): Promise<DialogSummary[]>;
export {};
//# sourceMappingURL=telegram-mtproto.d.ts.map