import { FastifyInstance, FastifyReply } from "fastify";
import {
  validateVkParams,
  parseVkParams,
  getAccessTokenFromVkParams,
} from "../../../core/vk-auth.js";
import { getUserInfo } from "../../../core/vk-api.js";
import {
  initVkIdAuth,
  exchangeSilentToken,
  exchangeCodeForToken,
} from "../../../core/vk-id.js";
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
 * GET /vk/auth/init - Инициация VK ID авторизации (современный подход)
 * Генерирует UUID и редиректит на id.vk.com
 */
export async function handleVkIdInit(
  fastify: FastifyInstance,
  request: any,
  reply: FastifyReply
) {
  const appId = process.env.VK_APP_ID;
  const redirectUri = process.env.VK_REDIRECT_URI;

  if (!appId || !redirectUri) {
    fastify.log.error("VK_APP_ID or VK_REDIRECT_URI is not set");
    return reply.status(500).send({ error: "Server configuration error" });
  }

  try {
    // Генерируем UUID и формируем URL с state=uuid
    // VK ID вернет state обратно в hash или query параметрах
    const { uuid, authUrl } = initVkIdAuth(appId, redirectUri, "email");
    fastify.log.info(`🔐 Инициация VK ID авторизации с UUID: ${uuid}`);
    return reply.redirect(authUrl);
  } catch (error) {
    fastify.log.error(`❌ Ошибка инициации VK ID: ${error}`);
    return reply.status(500).send({ error: "Failed to initialize VK ID auth" });
  }
}

/**
 * GET /vk/auth/callback - VK ID callback (обработка redirect от id.vk.com)
 * VK ID редиректит с токенами в hash (#access_token=...&silent_token=...&state=uuid)
 * State содержит UUID, который мы передали при инициации
 * Hash не доступен на сервере, поэтому редиректим на фронтенд для обработки
 */
export async function handleVkIdCallback(
  fastify: FastifyInstance,
  request: any,
  reply: FastifyReply
) {
  // VK ID возвращает токены в hash, который не доступен на сервере
  // State (UUID) может быть в query параметрах (если VK ID добавил его туда)
  const state = (request.query as { state?: string })?.state;

  // Редиректим на фронтенд, который обработает hash и отправит на /vk/auth/silent
  // UUID будет в hash (state) или можно передать через query
  if (state) {
    return reply.redirect(
      `${FRONTEND_URL}/auth?vk_callback=true&state=${state}`
    );
  }
  return reply.redirect(`${FRONTEND_URL}/auth?vk_callback=true`);
}

/**
 * POST /vk/auth/code - Обработка code от VK ID SDK
 * Фронтенд отправляет code и device_id от VK ID SDK, обмениваем на access_token и авторизуем пользователя
 */
export async function handleVkIdCode(
  fastify: FastifyInstance,
  request: any,
  reply: FastifyReply
) {
  const { code, device_id } = request.body as {
    code?: string;
    device_id?: string;
  };

  if (!code || !device_id) {
    return reply.status(400).send({
      error: "code and device_id are required",
    });
  }

  const appId = process.env.VK_APP_ID;
  const appSecret = process.env.VK_APP_SECRET;

  if (!appId || !appSecret) {
    fastify.log.error("VK_APP_ID or VK_APP_SECRET is not set");
    return reply.status(500).send({ error: "Server configuration error" });
  }

  try {
    // Обмен code на access token
    const tokenResponse = await exchangeCodeForToken(
      appId,
      appSecret,
      code,
      device_id
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

      fastify.log.info(`✅ Создан новый пользователь из VK ID: ${user.id}`);
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

    fastify.log.info(`🔐 VK ID авторизация успешна: ${user.id}`);

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
    fastify.log.error(`❌ Ошибка VK ID авторизации: ${error}`);
    return reply.status(500).send({ error: "Internal server error" });
  }
}

/**
 * POST /vk/auth/silent - Обработка silent token от VK ID
 * Фронтенд отправляет silent_token, обмениваем на access_token и авторизуем пользователя
 * @deprecated Используйте handleVkIdCode для работы с VK ID SDK
 */
export async function handleVkIdSilent(
  fastify: FastifyInstance,
  request: any,
  reply: FastifyReply
) {
  const { silent_token, uuid } = request.body as {
    silent_token?: string;
    uuid?: string;
  };

  if (!silent_token || !uuid) {
    return reply.status(400).send({
      error: "silent_token and uuid are required",
    });
  }

  const appId = process.env.VK_APP_ID;

  if (!appId) {
    fastify.log.error("VK_APP_ID is not set");
    return reply.status(500).send({ error: "Server configuration error" });
  }

  try {
    // Обмен silent token на access token
    const tokenResponse = await exchangeSilentToken(appId, silent_token, uuid);

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

      fastify.log.info(`✅ Создан новый пользователь из VK ID: ${user.id}`);
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

    fastify.log.info(`🔐 VK ID авторизация успешна: ${user.id}`);

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
    fastify.log.error(`❌ Ошибка VK ID авторизации: ${error}`);
    return reply.status(500).send({ error: "Internal server error" });
  }
}
