/**
 * VK OAuth авторизация
 */
export interface VkOAuthTokenResponse {
    access_token: string;
    expires_in: number;
    user_id: number;
    refresh_token?: string;
}
/**
 * Генерация URL для OAuth авторизации
 */
export declare function getOAuthUrl(appId: string, redirectUri: string, scope?: string, state?: string): string;
/**
 * Обмен code на access_token
 */
export declare function exchangeCodeForToken(appId: string, appSecret: string, code: string, redirectUri: string): Promise<VkOAuthTokenResponse>;
/**
 * Обновление access_token через refresh_token
 */
export declare function refreshAccessToken(appId: string, appSecret: string, refreshToken: string): Promise<VkOAuthTokenResponse>;
/**
 * Проверка валидности токена
 */
export declare function validateToken(accessToken: string): Promise<boolean>;
//# sourceMappingURL=vk-oauth.d.ts.map