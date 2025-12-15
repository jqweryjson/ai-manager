import { validateTelegramInitData, parseTelegramInitData, validateTelegramLoginWidget, } from "../../../core/telegram-auth.js";
import { findUserByTelegramId, createUser, } from "../../../core/user-postgres.js";
import { createSession } from "../../../core/session.js";
import { generateAccessToken, generateRefreshToken, } from "../../../middleware/auth.js";
/**
 * POST /tg/auth - Telegram Mini App авторизация
 */
export async function handleTelegramAuth(fastify, request, reply) {
    const { initData } = request.body;
    if (!initData) {
        return reply.status(400).send({ error: "initData is required" });
    }
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
        fastify.log.error("TELEGRAM_BOT_TOKEN is not set");
        return reply.status(500).send({ error: "Server configuration error" });
    }
    // Валидация HMAC подписи
    if (!validateTelegramInitData(initData, botToken)) {
        fastify.log.warn("Invalid Telegram initData signature");
        return reply.status(401).send({ error: "Invalid initData signature" });
    }
    // Парсинг данных пользователя
    const telegramUser = parseTelegramInitData(initData);
    if (!telegramUser || !telegramUser.id) {
        return reply.status(400).send({ error: "Invalid user data in initData" });
    }
    try {
        // Поиск существующего пользователя по telegram_id
        let user = await findUserByTelegramId(telegramUser.id.toString());
        // Если пользователь не найден, создаём нового
        if (!user) {
            const fullName = `${telegramUser.first_name}${telegramUser.last_name ? ` ${telegramUser.last_name}` : ""}`;
            user = await createUser({
                email: `tg_${telegramUser.id}@telegram.local`,
                name: fullName,
                ...(telegramUser.photo_url && { picture: telegramUser.photo_url }),
                telegramId: telegramUser.id.toString(),
            });
            fastify.log.info(`✅ Создан новый пользователь из Telegram: ${user.id}`);
        }
        // Генерация JWT токенов
        const accessToken = generateAccessToken({
            userId: user.id,
            email: user.email,
        });
        const refreshToken = generateRefreshToken({
            userId: user.id,
            email: user.email,
        });
        // Создание сессии
        await createSession(user.id, {
            email: user.email,
            name: user.name,
            picture: user.picture ?? "",
        });
        fastify.log.info(`🔐 Telegram авторизация успешна: ${user.id}`);
        return {
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                picture: user.picture,
            },
        };
    }
    catch (error) {
        fastify.log.error(`❌ Ошибка Telegram авторизации: ${error}`);
        return reply.status(500).send({ error: "Internal server error" });
    }
}
/**
 * POST /auth/telegram-web - Telegram Login Widget авторизация (для веб-версии)
 */
export async function handleTelegramWebAuth(fastify, request, reply) {
    const data = request.body;
    if (!data || !data.id || !data.hash) {
        return reply.status(400).send({ error: "Invalid request data" });
    }
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
        fastify.log.error("TELEGRAM_BOT_TOKEN is not set");
        return reply.status(500).send({ error: "Server configuration error" });
    }
    // Валидация HMAC подписи
    if (!validateTelegramLoginWidget(data, botToken)) {
        fastify.log.warn("Invalid Telegram Login Widget signature");
        return reply.status(401).send({ error: "Invalid signature" });
    }
    // Проверка времени авторизации (не старше 24 часов)
    const authDate = new Date(data.auth_date * 1000);
    const now = new Date();
    const hoursDiff = (now.getTime() - authDate.getTime()) / (1000 * 60 * 60);
    if (hoursDiff > 24) {
        fastify.log.warn("Telegram Login Widget data expired");
        return reply.status(401).send({ error: "Authorization data expired" });
    }
    try {
        // Поиск существующего пользователя по telegram_id
        let user = await findUserByTelegramId(data.id.toString());
        // Если пользователь не найден, создаём нового
        if (!user) {
            const fullName = `${data.first_name}${data.last_name ? ` ${data.last_name}` : ""}`;
            user = await createUser({
                email: `tg_${data.id}@telegram.local`,
                name: fullName,
                ...(data.photo_url && { picture: data.photo_url }),
                telegramId: data.id.toString(),
            });
            fastify.log.info(`✅ Создан новый пользователь из Telegram Login Widget: ${user.id}`);
        }
        // Генерация JWT токенов
        const accessToken = generateAccessToken({
            userId: user.id,
            email: user.email,
        });
        const refreshToken = generateRefreshToken({
            userId: user.id,
            email: user.email,
        });
        // Создание сессии
        await createSession(user.id, {
            email: user.email,
            name: user.name,
            picture: user.picture ?? "",
        });
        fastify.log.info(`🔐 Telegram Login Widget авторизация успешна: ${user.id}`);
        return {
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                picture: user.picture,
            },
        };
    }
    catch (error) {
        fastify.log.error(`❌ Ошибка Telegram Login Widget авторизации: ${error}`);
        return reply.status(500).send({ error: "Internal server error" });
    }
}
//# sourceMappingURL=telegram.js.map