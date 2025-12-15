/**
 * VK ID API (server-side) helpers.
 *
 * Используем для верификации access_token, полученного на фронтенде через `@vkid/sdk`,
 * и получения профиля пользователя VK ID.
 */
export type VkIdUserInfo = {
    user: {
        user_id: string;
        first_name?: string;
        last_name?: string;
        phone?: string;
        email?: string;
        avatar?: string;
        sex?: number;
        verified?: boolean;
        birthday?: string;
    };
};
/**
 * Получить профиль VK ID по access_token.
 *
 * Важно: VK ID API ожидает токен в body как x-www-form-urlencoded (как в официальной доке).
 */
export declare function getVkIdUserInfo(params: {
    appId: string;
    accessToken: string;
}): Promise<VkIdUserInfo>;
//# sourceMappingURL=vkid-api.d.ts.map