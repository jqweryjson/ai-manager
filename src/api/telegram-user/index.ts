import { FastifyInstance } from "fastify";
import { handleStart, handleVerify, handle2FA } from "./handlers/auth.js";
import { handleStatus, handleDisconnect } from "./handlers/account.js";
import {
  handleDialogs,
  handleContacts,
  handleAllDialogs,
} from "./handlers/dialogs.js";
import { handleSubscriptions } from "./handlers/subscriptions.js";
import { handleGetSubscriptions } from "./handlers/getSubscriptions.js";
import { handleTelegramEvent } from "./handlers/events.js";
import { handleSendMessage } from "./handlers/send.js";

export async function telegramUserRoutes(fastify: FastifyInstance) {
  // Авторизация
  fastify.post(
    "/tg-user/start",
    { preHandler: (fastify as any).authenticate },
    async (request, reply) => handleStart(fastify, request as any, reply)
  );

  fastify.post(
    "/tg-user/verify",
    { preHandler: (fastify as any).authenticate },
    async (request, reply) => handleVerify(fastify, request as any, reply)
  );

  fastify.post(
    "/tg-user/2fa",
    { preHandler: (fastify as any).authenticate },
    async (request, reply) => handle2FA(fastify, request as any, reply)
  );

  // Управление аккаунтом
  fastify.get(
    "/tg-user/status",
    { preHandler: (fastify as any).authenticate },
    async (request, reply) => handleStatus(fastify, request as any, reply)
  );

  fastify.post(
    "/tg-user/disconnect",
    { preHandler: (fastify as any).authenticate },
    async (request, reply) => handleDisconnect(fastify, request as any, reply)
  );

  // Диалоги
  fastify.get(
    "/tg-user/dialogs",
    { preHandler: (fastify as any).authenticate },
    async (request, reply) => handleDialogs(fastify, request, reply)
  );

  fastify.get(
    "/tg-user/contacts",
    { preHandler: (fastify as any).authenticate },
    async (request, reply) => handleContacts(fastify, request, reply)
  );

  fastify.get(
    "/tg-user/all-dialogs",
    { preHandler: (fastify as any).authenticate },
    async (request, reply) => handleAllDialogs(fastify, request, reply)
  );

  // Отправка сообщений в Telegram (используется сервером / для тестов)
  fastify.post(
    "/tg-user/send",
    { preHandler: (fastify as any).authenticate },
    async (request, reply) => handleSendMessage(fastify, request as any, reply)
  );

  // Подписки
  fastify.get(
    "/tg-user/subscriptions",
    { preHandler: (fastify as any).authenticate },
    async (request, reply) =>
      handleGetSubscriptions(fastify, request as any, reply)
  );

  fastify.post(
    "/tg-user/subscriptions",
    { preHandler: (fastify as any).authenticate },
    async (request, reply) =>
      handleSubscriptions(fastify, request as any, reply)
  );

  // Внутренние события (без аутентификации - только для Listener)
  fastify.post("/internal/tg-user/events", async (request, reply) =>
    handleTelegramEvent(fastify, request, reply)
  );
}
