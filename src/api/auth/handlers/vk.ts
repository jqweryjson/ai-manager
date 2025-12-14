import { FastifyInstance, FastifyReply } from "fastify";
import {
  validateVkParams,
  parseVkParams,
  getAccessTokenFromVkParams,
} from "../../../core/vk-auth.js";
import { getUserInfo } from "../../../core/vk-api.js";
import { exchangeCodeForToken } from "../../../core/vk-oauth.js";
import { findUserByVkId, createUser } from "../../../core/user-postgres.js";
import { createSession } from "../../../core/session.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../../../middleware/auth.js";

/**
 * POST /vk/auth - VK Mini App авторизация
 */
export async function handleVkAuth(
  fastify: FastifyInstance,
  request: any,
  reply: FastifyReply
) {
  const { vkParams } = request.body as { vkParams?: string };

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

    if (!accessToken) {
      fastify.log.warn(
        "Access token not found in vkParams - may need to get via VK API"
      );
      return reply.status(400).send({
        error:
          "Access token not found in vkParams. Mini App token handling needs implementation.",
      });
    }

    // Получение информации о пользователе через VK API
    let vkUserInfo: {
      id: number;
      first_name: string;
      last_name: string;
      photo_200?: string;
    };
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
    } catch (error) {
      fastify.log.error(`Failed to get VK user info: ${error}`);
      // Если не удалось получить через API, используем данные из vk-params
      vkUserInfo = {
        id: vkUserId,
        first_name: vkData.first_name || "",
        last_name: vkData.last_name || "",
        ...(vkData.photo && { photo_200: vkData.photo }),
      };
    }

    // Поиск существующего пользователя по vk_id
    let user = await findUserByVkId(vkUserId);

    // Если пользователь не найден, создаём нового
    if (!user) {
      const fullName = `${vkUserInfo.first_name}${
        vkUserInfo.last_name ? ` ${vkUserInfo.last_name}` : ""
      }`;

      user = await createUser({
        email: `vk_${vkUserId}@vk.local`,
        name: fullName,
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
  } catch (error) {
    fastify.log.error(`❌ Ошибка VK авторизации: ${error}`);
    return reply.status(500).send({ error: "Internal server error" });
  }
}

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:8002";

/**
 * GET /vk/auth/oauth/callback - VK OAuth callback (обработка redirect от VK)
 */
export async function handleVkOAuthCallback(
  fastify: FastifyInstance,
  request: any,
  reply: FastifyReply
) {
  const { code, error } = request.query as { code?: string; error?: string };

  if (error) {
    fastify.log.warn(`VK OAuth error: ${error}`);
    return reply.redirect(`${FRONTEND_URL}/auth?error=vk_oauth_denied`);
  }

  if (!code) {
    return reply.redirect(`${FRONTEND_URL}/auth?error=missing_code`);
  }

  // Передаем code через query в handleVkOAuth
  return handleVkOAuth(fastify, { query: { code }, body: {} } as any, reply);
}

/**
 * POST /vk/auth/oauth - VK OAuth авторизация (для Standalone/Сайт)
 * GET /vk/auth/oauth/callback - обрабатывается через handleVkOAuthCallback
 */
export async function handleVkOAuth(
  fastify: FastifyInstance,
  request: any,
  reply: FastifyReply
) {
  // Поддерживаем и GET (query) и POST (body)
  const code = (request.query as { code?: string })?.code || 
               (request.body as { code?: string })?.code;

  if (!code) {
    return reply.redirect(`${FRONTEND_URL}/auth?error=missing_code`);
  }

  const appId = process.env.VK_APP_ID;
  const appSecret = process.env.VK_APP_SECRET;
  const redirectUri = process.env.VK_REDIRECT_URI;

  if (!appId || !appSecret || !redirectUri) {
    fastify.log.error("VK_APP_ID, VK_APP_SECRET or VK_REDIRECT_URI is not set");
    return reply.status(500).send({ error: "Server configuration error" });
  }

  try {
    // Обмен code на access_token
    const tokenResponse = await exchangeCodeForToken(
      appId,
      appSecret,
      code,
      redirectUri
    );

    const { access_token, user_id: vkUserId } = tokenResponse;

    // Получение информации о пользователе через VK API
    let vkUserInfo: {
      id: number;
      first_name: string;
      last_name: string;
      photo_200?: string;
    };
    try {
      const users = await getUserInfo(access_token, [vkUserId]);
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
    } catch (error) {
      fastify.log.error(`Failed to get VK user info: ${error}`);
      return reply
        .status(500)
        .send({ error: "Failed to get user info from VK" });
    }

    // Поиск существующего пользователя по vk_id
    let user = await findUserByVkId(vkUserId);

    // Если пользователь не найден, создаём нового
    if (!user) {
      const fullName = `${vkUserInfo.first_name}${
        vkUserInfo.last_name ? ` ${vkUserInfo.last_name}` : ""
      }`;

      user = await createUser({
        email: `vk_${vkUserId}@vk.local`,
        name: fullName,
        ...(vkUserInfo.photo_200 && { picture: vkUserInfo.photo_200 }),
        vkId: vkUserId,
      });

      fastify.log.info(`✅ Создан новый пользователь из VK OAuth: ${user.id}`);
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

    fastify.log.info(`🔐 VK OAuth авторизация успешна: ${user.id}`);
    
    // Редирект на фронтенд с токенами в URL (как Google OAuth)
    return reply.redirect(
      `${FRONTEND_URL}/app?token=${accessTokenJWT}&refresh=${refreshTokenJWT}`
    );
  } catch (error) {
    fastify.log.error(`❌ Ошибка VK OAuth авторизации: ${error}`);
    return reply.redirect(`${FRONTEND_URL}/auth?error=vk_oauth_failed`);
  }
}
