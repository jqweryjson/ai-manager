import { getOAuthUrl, exchangeCodeForToken } from "../../../core/vk-oauth.js";
import { getUserInfo } from "../../../core/vk-api.js";
import { upsertUserVkAccount, } from "../../../core/vk-account-postgres.js";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:8002";
/**
 * POST /api/vk-user/start - начало OAuth авторизации
 * Возвращает OAuth URL для редиректа
 */
export async function handleStart(fastify, request, reply) {
    try {
        const appId = process.env.VK_APP_ID;
        const redirectUri = process.env.VK_REDIRECT_URI;
        if (!appId || !redirectUri) {
            fastify.log.error("VK_APP_ID or VK_REDIRECT_URI is not set");
            return reply.status(500).send({ error: "Server configuration error" });
        }
        // Используем user_id как state для передачи в OAuth callback
        const state = request.userId;
        // Генерируем OAuth URL с state
        const oauthUrl = getOAuthUrl(appId, redirectUri, "messages,offline", state);
        fastify.log.info(`📱 Начало подключения VK для пользователя ${request.userId}`);
        return {
            oauth_url: oauthUrl,
        };
    }
    catch (error) {
        fastify.log.error(`❌ Ошибка start connection: ${error}`);
        return reply.status(500).send({
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
}
/**
 * GET /api/vk-user/callback - OAuth callback
 * Обрабатывает code и создает аккаунт
 */
export async function handleCallback(fastify, request, reply) {
    try {
        const { code, state } = request.query;
        if (!code) {
            return reply.redirect(`${FRONTEND_URL}/app/integrations?error=missing_code`);
        }
        // Получаем user_id из state параметра
        const userId = state;
        if (!userId) {
            return reply.redirect(`${FRONTEND_URL}/app/integrations?error=missing_state`);
        }
        const appId = process.env.VK_APP_ID;
        const appSecret = process.env.VK_APP_SECRET;
        const redirectUri = process.env.VK_REDIRECT_URI;
        if (!appId || !appSecret || !redirectUri) {
            fastify.log.error("VK_APP_ID, VK_APP_SECRET or VK_REDIRECT_URI is not set");
            return reply.redirect(`${FRONTEND_URL}/app/integrations?error=server_config`);
        }
        // Обмен code на access_token
        const tokenResponse = await exchangeCodeForToken(appId, appSecret, code, redirectUri);
        const { access_token, user_id: vkUserId, expires_in } = tokenResponse;
        // Получение информации о пользователе через VK API
        let vkUserInfo;
        try {
            const users = await getUserInfo(access_token, [vkUserId]);
            vkUserInfo = users[0];
            if (!vkUserInfo) {
                throw new Error("User info not found");
            }
        }
        catch (error) {
            fastify.log.error(`Failed to get VK user info: ${error}`);
            return reply.redirect(`${FRONTEND_URL}/app/integrations?error=user_info_failed`);
        }
        const expiresAt = expires_in
            ? new Date(Date.now() + expires_in * 1000)
            : null;
        // MVP: 1 пользователь -> 1 vk_account (upsert)
        const account = await upsertUserVkAccount({
            userId,
            accessToken: access_token,
            refreshToken: tokenResponse.refresh_token || null,
            userIdVk: vkUserId,
            expiresAt,
        });
        fastify.log.info(`✅ VK аккаунт подключен (upsert): ${account.id} для пользователя ${userId}`);
        // Сигнализируем VK Service, чтобы он начал слушать новый аккаунт
        try {
            const backendPort = Number(process.env.BACKEND_PORT) || 4001;
            const backendUrl = process.env.BACKEND_INTERNAL_URL || `http://localhost:${backendPort}`;
            await fetch(`${backendUrl}/api/internal/vk-user/listener/reload-account`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    account_id: account.id,
                    user_id: userId,
                }),
            });
            fastify.log.info(`📡 Отправлен запрос reload-account для VK Service: ${account.id}`);
        }
        catch (notifyError) {
            fastify.log.error(`⚠️  Не удалось отправить reload-account для VK Service: ${notifyError}`);
        }
        return reply.redirect(`${FRONTEND_URL}/app/integrations?success=vk_connected&account_id=${account.id}`);
    }
    catch (error) {
        fastify.log.error(`❌ Ошибка OAuth callback: ${error}`);
        return reply.redirect(`${FRONTEND_URL}/app/integrations?error=oauth_failed`);
    }
}
//# sourceMappingURL=auth.js.map