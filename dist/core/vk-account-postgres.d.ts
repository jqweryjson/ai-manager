export type VkAccountStatus = "pending_auth" | "connected" | "expired";
export interface VkAccount {
    id: string;
    user_id: string;
    access_token: string;
    refresh_token: string | null;
    user_id_vk: number | null;
    status: VkAccountStatus;
    expires_at: Date | null;
    created_at: Date;
    updated_at: Date;
}
/**
 * Создаёт новый VK аккаунт для интеграции
 */
export declare function createVkAccount(userId: string, accessToken: string, refreshToken: string | null, userIdVk: number | null, expiresAt: Date | null): Promise<VkAccount>;
/**
 * Получает аккаунт по ID с проверкой ownership
 */
export declare function getVkAccount(accountId: string, userId: string): Promise<VkAccount | null>;
/**
 * Получает все аккаунты пользователя
 */
export declare function getUserVkAccounts(userId: string): Promise<VkAccount[]>;
/**
 * Обновляет токен аккаунта
 */
export declare function updateVkAccountToken(accountId: string, userId: string, accessToken: string, refreshToken: string | null, expiresAt: Date | null): Promise<void>;
/**
 * Обновляет статус аккаунта
 */
export declare function updateVkAccountStatus(accountId: string, userId: string, status: VkAccountStatus): Promise<void>;
/**
 * Расшифровывает данные аккаунта
 */
export declare function decryptVkAccount(account: VkAccount): {
    access_token: string;
    refresh_token: string | null;
};
/**
 * Удаляет аккаунт
 */
export declare function deleteVkAccount(accountId: string, userId: string): Promise<void>;
export interface VkSubscription {
    id: string;
    vk_account_id: string;
    peer_id: string;
    peer_type: "user" | "chat" | "group";
    title: string;
    enabled: boolean;
    workspace_id: string | null;
    role_id: string | null;
    mention_only: boolean;
    next_allowed_at: Date | null;
    created_at: Date;
    updated_at: Date;
}
export declare function listVkSubscriptions(accountId: string, userId: string): Promise<VkSubscription[]>;
export declare function upsertVkSubscriptions(accountId: string, userId: string, items: Array<{
    peer_id: string;
    peer_type: "user" | "chat" | "group";
    title: string;
    enabled?: boolean | null;
    workspace_id?: string | null;
    role_id?: string | null;
    mention_only?: boolean | null;
}>): Promise<void>;
/**
 * Проверка, можно ли отправить сообщение (rate limiting)
 */
export declare function canSendMessage(accountId: string, peerId: string): Promise<boolean>;
/**
 * Обновление времени блокировки (rate limiting)
 */
export declare function updateNextAllowedAt(accountId: string, peerId: string, seconds: number): Promise<void>;
//# sourceMappingURL=vk-account-postgres.d.ts.map