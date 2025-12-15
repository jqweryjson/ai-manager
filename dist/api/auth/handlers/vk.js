import { validateVkParams, parseVkParams, getAccessTokenFromVkParams, } from "../../../core/vk-auth.js";
import { getUserInfo } from "../../../core/vk-api.js";
import { getVkIdUserInfo } from "../../../core/vkid-api.js";
import { findUserByVkId, createUser } from "../../../core/user-postgres.js";
import { createSession } from "../../../core/session.js";
import { generateAccessToken, generateRefreshToken, } from "../../../middleware/auth.js";
/**
 * POST /vk/auth - VK Mini App авторизация
 */
export async function handleVkAuth(fastify, request, reply) {
    const { vkParams } = request.body;
    if (!vkParams) {
        return reply.status(400).send({ error: "vkParams is required" });
    }
    const appSecret = process.env.VK_APP_SECRET;
    if (!appSecret) {
        fastify.log.error("VK_APP_SECRET is not set");
        return reply.status(500).send({ error: "Server configuration error" });
    }
    // Валидация подписи vk-params
    if (!validateVkParams(vkParams, appSecret)) {
        fastify.log.warn("Invalid VK params signature");
        return reply.status(401).send({ error: "Invalid vkParams signature" });
    }
    try {
        // Парсинг данных из vk-params
        const vkData = parseVkParams(vkParams);
        if (!vkData || !vkData.id) {
            return reply.status(400).send({ error: "Invalid user data in vkParams" });
        }
        const vkUserId = vkData.id;
        // Получение access_token из vk-params (если есть)
        let accessToken = getAccessTokenFromVkParams(vkParams);
        // Получение информации о пользователе через VK API
        let vkUserInfo;
        if (accessToken) {
            try {
                const users = await getUserInfo(accessToken, [vkUserId]);
                const userInfo = users[0];
                if (!userInfo) {
                    throw new Error("User info not found");
                }
                vkUserInfo = {
                    id: userInfo.id,
                    first_name: userInfo.first_name,
                    last_name: userInfo.last_name,
                    ...(userInfo.photo_200 && { photo_200: userInfo.photo_200 }),
                };
            }
            catch (error) {
                fastify.log.error(`Failed to get VK user info: ${error}`);
                vkUserInfo = {
                    id: vkUserId,
                    first_name: vkData.first_name || "",
                    last_name: vkData.last_name || "",
                    ...(vkData.photo && { photo_200: vkData.photo }),
                };
            }
        }
        else {
            // В Mini App часто токена нет в vk-params — не блокируем логин.
            // Можно будет улучшить позже, добавив vk-bridge (VKWebAppGetUserInfo / VKWebAppGetAuthToken).
            fastify.log.warn("VK Mini App: access_token not found in vkParams; login without VK API call");
            vkUserInfo = {
                id: vkUserId,
                first_name: vkData.first_name || "VK",
                last_name: vkData.last_name || `User ${vkUserId}`,
            };
        }
        // Поиск существующего пользователя по vk_id
        let user = await findUserByVkId(vkUserId);
        // Если пользователь не найден, создаём нового
        if (!user) {
            const fullName = `${vkUserInfo.first_name}${vkUserInfo.last_name ? ` ${vkUserInfo.last_name}` : ""}`;
            user = await createUser({
                email: `vk_${vkUserId}@vk.local`,
                name: fullName || `VK User ${vkUserId}`,
                ...(vkUserInfo.photo_200 && { picture: vkUserInfo.photo_200 }),
                vkId: vkUserId,
            });
            fastify.log.info(`✅ Создан новый пользователь из VK: ${user.id}`);
        }
        // Генерация JWT токенов
        const accessTokenJWT = generateAccessToken({
            userId: user.id,
            email: user.email,
        });
        const refreshTokenJWT = generateRefreshToken({
            userId: user.id,
            email: user.email,
        });
        // Создание сессии
        await createSession(user.id, {
            email: user.email,
            name: user.name,
            picture: user.picture ?? "",
        });
        fastify.log.info(`🔐 VK авторизация успешна: ${user.id}`);
        return {
            accessToken: accessTokenJWT,
            refreshToken: refreshTokenJWT,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                picture: user.picture,
            },
        };
    }
    catch (error) {
        fastify.log.error(`❌ Ошибка VK авторизации: ${error}`);
        return reply.status(500).send({ error: "Internal server error" });
    }
}
/**
 * POST /vk/auth/vkid-login - Web login через VK ID SDK
 *
 * Фронтенд делает `Auth.exchangeCode(...)` через `@vkid/sdk`,
 * затем отправляет access_token сюда для верификации и выпуска наших JWT.
 */
export async function handleVkIdLogin(fastify, request, reply) {
    const { access_token } = request.body;
    if (!access_token) {
        return reply.status(400).send({ error: "access_token is required" });
    }
    const appId = process.env.VK_APP_ID;
    if (!appId) {
        fastify.log.error("VK_APP_ID is not set");
        return reply.status(500).send({ error: "Server configuration error" });
    }
    try {
        const userInfo = await getVkIdUserInfo({
            appId,
            accessToken: access_token,
        });
        const vkUserId = Number(userInfo.user.user_id);
        if (!vkUserId || Number.isNaN(vkUserId)) {
            return reply.status(500).send({ error: "Invalid VK user_id" });
        }
        // Поиск существующего пользователя по vk_id
        let user = await findUserByVkId(vkUserId);
        // Если пользователь не найден, создаём нового
        if (!user) {
            const firstName = userInfo.user.first_name ?? "";
            const lastName = userInfo.user.last_name ?? "";
            const fullName = `${firstName}${lastName ? ` ${lastName}` : ""}`.trim();
            user = await createUser({
                // email может быть не выдан по scope, поэтому используем fallback
                email: userInfo.user.email ?? `vk_${vkUserId}@vk.local`,
                name: fullName || `VK User ${vkUserId}`,
                ...(userInfo.user.avatar && { picture: userInfo.user.avatar }),
                vkId: vkUserId,
            });
            fastify.log.info(`✅ Создан новый пользователь из VK ID: ${user.id}`);
        }
        const accessTokenJWT = generateAccessToken({
            userId: user.id,
            email: user.email,
        });
        const refreshTokenJWT = generateRefreshToken({
            userId: user.id,
            email: user.email,
        });
        await createSession(user.id, {
            email: user.email,
            name: user.name,
            picture: user.picture ?? "",
        });
        fastify.log.info(`🔐 VK ID login успешен: ${user.id}`);
        return {
            accessToken: accessTokenJWT,
            refreshToken: refreshTokenJWT,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                picture: user.picture,
            },
        };
    }
    catch (error) {
        fastify.log.error(`❌ Ошибка VK ID login: ${error}`);
        return reply.status(500).send({ error: "Internal server error" });
    }
}
//# sourceMappingURL=vk.js.map