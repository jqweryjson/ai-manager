import { FastifyInstance } from "fastify";
import jwt from "jsonwebtoken";
import { getGoogleAuthUrl, getGoogleUserInfo } from "../core/google-oauth.js";
import {
  findUserByEmail,
  createUser,
  getUserById,
  findUserByTelegramId,
} from "../core/user-postgres.js";
import { createSession, deleteAllUserSessions } from "../core/session.js";
import {
  generateAccessToken,
  generateRefreshToken,
  authMiddleware,
  type AuthenticatedRequest,
} from "../middleware/auth.js";
import type { JWTPayload } from "../types/auth.js";
import {
  validateTelegramInitData,
  parseTelegramInitData,
  validateTelegramLoginWidget,
  type TelegramLoginWidgetData,
} from "../core/telegram-auth.js";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:8002";

export async function authRoutes(fastify: FastifyInstance) {
  // Google OAuth инициация
  fastify.get("/auth/google", async (request, reply) => {
    const authUrl = getGoogleAuthUrl();
    return reply.redirect(authUrl);
  });

  // Google OAuth callback
  fastify.get("/auth/callback", async (request, reply) => {
    const { code } = request.query as { code?: string };

    if (!code) {
      return reply.redirect(`${FRONTEND_URL}/auth?error=missing_code`);
    }

    try {
      const googleUser = await getGoogleUserInfo(code);

      let user = await findUserByEmail(googleUser.email);

      if (!user) {
        user = await createUser({
          email: googleUser.email,
          name: googleUser.name,
          picture: googleUser.picture,
          googleId: googleUser.id,
        });
      }

      const accessToken = generateAccessToken({
        userId: user.id,
        email: user.email,
      });

      const refreshToken = generateRefreshToken({
        userId: user.id,
        email: user.email,
      });

      await createSession(user.id, {
        email: user.email,
        name: user.name,
        picture: user.picture ?? "",
      });

      return reply.redirect(
        `${FRONTEND_URL}/app?token=${accessToken}&refresh=${refreshToken}`
      );
    } catch (error) {
      fastify.log.error(error);
      return reply.redirect(`${FRONTEND_URL}/auth?error=oauth_failed`);
    }
  });

  // Получить текущего пользователя
  fastify.get(
    "/auth/me",
    { preHandler: authMiddleware },
    async (request, reply) => {
      const req = request as AuthenticatedRequest;
      const user = await getUserById(req.userId);

      if (!user) {
        return reply.status(404).send({ error: "User not found" });
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
      };
    }
  );

  // Выход
  fastify.post(
    "/auth/logout",
    { preHandler: authMiddleware },
    async (request, reply) => {
      const req = request as AuthenticatedRequest;
      await deleteAllUserSessions(req.userId);
      return { success: true };
    }
  );

  // Обновление access token через refresh token
  fastify.post("/auth/refresh", async (request, reply) => {
    const { refreshToken } = request.body as { refreshToken: string };

    if (!refreshToken) {
      return reply.status(400).send({ error: "Refresh token required" });
    }

    try {
      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_SECRET || "dev-secret"
      ) as JWTPayload;

      const newAccessToken = generateAccessToken({
        userId: decoded.userId,
        email: decoded.email,
      });

      return {
        accessToken: newAccessToken,
      };
    } catch (error) {
      return reply.status(401).send({ error: "Invalid refresh token" });
    }
  });

  // Telegram Mini App авторизация
  fastify.post("/tg/auth", async (request, reply) => {
    const { initData } = request.body as { initData?: string };

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
        const fullName = `${telegramUser.first_name}${
          telegramUser.last_name ? ` ${telegramUser.last_name}` : ""
        }`;

        user = await createUser({
          email: `tg_${telegramUser.id}@telegram.local`, // Временный email для Telegram пользователей
          name: fullName,
          ...(telegramUser.photo_url && { picture: telegramUser.photo_url }),
          telegramId: telegramUser.id.toString(),
        });

        fastify.log.info(
          `✅ Создан новый пользователь из Telegram: ${user.id}`
        );
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
    } catch (error) {
      fastify.log.error(`❌ Ошибка Telegram авторизации: ${error}`);
      return reply.status(500).send({ error: "Internal server error" });
    }
  });

  // Telegram Login Widget авторизация (для веб-версии)
  fastify.post("/auth/telegram-web", async (request, reply) => {
    const data = request.body as TelegramLoginWidgetData;

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
        const fullName = `${data.first_name}${
          data.last_name ? ` ${data.last_name}` : ""
        }`;

        user = await createUser({
          email: `tg_${data.id}@telegram.local`,
          name: fullName,
          ...(data.photo_url && { picture: data.photo_url }),
          telegramId: data.id.toString(),
        });

        fastify.log.info(
          `✅ Создан новый пользователь из Telegram Login Widget: ${user.id}`
        );
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

      fastify.log.info(
        `🔐 Telegram Login Widget авторизация успешна: ${user.id}`
      );

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
    } catch (error) {
      fastify.log.error(
        `❌ Ошибка Telegram Login Widget авторизации: ${error}`
      );
      return reply.status(500).send({ error: "Internal server error" });
    }
  });
}
