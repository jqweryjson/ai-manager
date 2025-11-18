export type TelegramAccountStatus = "pending_code" | "pending_2fa" | "connected" | "flood_wait";
export interface TelegramAccount {
    id: string;
    user_id: string;
    api_id: string;
    api_hash: string;
    session: string | null;
    status: TelegramAccountStatus;
    phone: string | null;
    phone_code_hash: string | null;
    flood_wait_until: Date | null;
    created_at: Date;
    updated_at: Date;
}
/**
 * Создаёт новый Telegram аккаунт
 */
export declare function createTelegramAccount(userId: string, apiId: string, apiHash: string, phone: string, phoneCodeHash: string, sessionString?: string): Promise<TelegramAccount>;
/**
 * Получает аккаунт по ID с проверкой ownership
 */
export declare function getTelegramAccount(accountId: string, userId: string): Promise<TelegramAccount | null>;
/**
 * Получает все аккаунты пользователя
 */
export declare function getUserTelegramAccounts(userId: string): Promise<TelegramAccount[]>;
/**
 * Обновляет сессию и статус аккаунта
 */
export declare function updateTelegramAccountSession(accountId: string, userId: string, sessionString: string, status: TelegramAccountStatus): Promise<void>;
/**
 * Обновляет статус аккаунта
 */
export declare function updateTelegramAccountStatus(accountId: string, userId: string, status: TelegramAccountStatus, floodWaitUntil?: Date | null): Promise<void>;
/**
 * Получает расшифрованные данные аккаунта
 */
export declare function decryptTelegramAccount(account: TelegramAccount): {
    apiId: number;
    apiHash: string;
    session: string | null;
};
/**
 * Удаляет аккаунт
 */
export declare function deleteTelegramAccount(accountId: string, userId: string): Promise<void>;
export interface TelegramSubscription {
    id: string;
    telegram_account_id: string;
    peer_id: string;
    peer_type: "user" | "chat" | "channel";
    title: string;
    enabled: boolean;
    workspace_id: string | null;
    role_id: string | null;
    created_at: Date;
    updated_at: Date;
}
export declare function listSubscriptions(accountId: string, userId: string): Promise<TelegramSubscription[]>;
export declare function upsertSubscriptions(accountId: string, userId: string, items: Array<{
    peer_id: string;
    peer_type: "user" | "chat" | "channel";
    title: string;
    enabled?: boolean;
    workspace_id?: string | null;
    role_id?: string | null;
}>): Promise<void>;
//# sourceMappingURL=telegram-account-postgres.d.ts.map