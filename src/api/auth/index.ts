import { FastifyInstance } from "fastify";
import { authMiddleware } from "../../middleware/auth.js";
import { handleGetMe, handleLogout, handleRefresh } from "./handlers/common.js";
import { handleGoogleAuth, handleGoogleCallback } from "./handlers/google.js";
import {
  handleTelegramAuth,
  handleTelegramWebAuth,
} from "./handlers/telegram.js";
import { handleVkAuth, handleVkOAuth, handleVkOAuthCallback } from "./handlers/vk.js";

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
  fastify.get("/vk/auth/oauth/callback", async (request, reply) =>
    handleVkOAuthCallback(fastify, request, reply)
  );
  fastify.post("/vk/auth/oauth", async (request, reply) =>
    handleVkOAuth(fastify, request, reply)
  );
}
