import { FastifyInstance } from "fastify";
import { authMiddleware } from "../../middleware/auth.js";
import { handleGetMe, handleLogout, handleRefresh } from "./handlers/common.js";
import { handleGoogleAuth, handleGoogleCallback } from "./handlers/google.js";
import {
  handleTelegramAuth,
  handleTelegramWebAuth,
} from "./handlers/telegram.js";
import { handleVkAuth, handleVkIdLogin } from "./handlers/vk.js";

export async function authRoutes(fastify: FastifyInstance) {
  // Google OAuth
  fastify.get("/auth/google", async (request, reply) =>
    handleGoogleAuth(fastify, request, reply)
  );
  fastify.get("/auth/callback", async (request, reply) =>
    handleGoogleCallback(fastify, request, reply)
  );

  // Общие эндпоинты
  fastify.get(
    "/auth/me",
    { preHandler: authMiddleware },
    async (request, reply) => handleGetMe(fastify, request as any, reply)
  );
  fastify.post(
    "/auth/logout",
    { preHandler: authMiddleware },
    async (request, reply) => handleLogout(fastify, request as any, reply)
  );
  fastify.post("/auth/refresh", async (request, reply) =>
    handleRefresh(fastify, request, reply)
  );

  // Telegram авторизация
  fastify.post("/tg/auth", async (request, reply) =>
    handleTelegramAuth(fastify, request, reply)
  );
  fastify.post("/auth/telegram-web", async (request, reply) =>
    handleTelegramWebAuth(fastify, request, reply)
  );

  // VK авторизация
  fastify.post("/vk/auth", async (request, reply) =>
    handleVkAuth(fastify, request, reply)
  );

  // VK ID Web login: frontend получает access_token через @vkid/sdk и отдаёт сюда на верификацию
  fastify.post("/vk/auth/vkid-login", async (request, reply) =>
    handleVkIdLogin(fastify, request, reply)
  );
}
