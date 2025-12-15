import { handleStart, handleCallback } from "./handlers/auth.js";
import { handleStatus, handleDisconnect } from "./handlers/account.js";
import { handleConversations } from "./handlers/conversations.js";
import { handleSubscriptions, handleGetSubscriptions, } from "./handlers/subscriptions.js";
import { handleSendMessage } from "./handlers/send.js";
import { handleVkEvent } from "./handlers/events.js";
import { handleReloadAccount } from "./handlers/listenerControl.js";
export async function vkUserRoutes(fastify) {
    // Авторизация
    fastify.post("/vk-user/start", { preHandler: fastify.authenticate }, async (request, reply) => handleStart(fastify, request, reply));
    fastify.get("/vk-user/callback", async (request, reply) => handleCallback(fastify, request, reply));
    // Управление аккаунтом
    fastify.get("/vk-user/status", { preHandler: fastify.authenticate }, async (request, reply) => handleStatus(fastify, request, reply));
    fastify.post("/vk-user/disconnect", { preHandler: fastify.authenticate }, async (request, reply) => handleDisconnect(fastify, request, reply));
    // Диалоги
    fastify.get("/vk-user/conversations", { preHandler: fastify.authenticate }, async (request, reply) => handleConversations(fastify, request, reply));
    // Отправка сообщений в VK (используется сервером / для тестов)
    fastify.post("/vk-user/send", { preHandler: fastify.authenticate }, async (request, reply) => handleSendMessage(fastify, request, reply));
    // Подписки
    fastify.get("/vk-user/subscriptions", { preHandler: fastify.authenticate }, async (request, reply) => handleGetSubscriptions(fastify, request, reply));
    fastify.post("/vk-user/subscriptions", { preHandler: fastify.authenticate }, async (request, reply) => handleSubscriptions(fastify, request, reply));
    // Внутренние события (без аутентификации - только для Listener)
    fastify.post("/internal/vk-user/events", async (request, reply) => handleVkEvent(fastify, request, reply));
    // Внутренний control API для VK Service (reload аккаунта)
    fastify.post("/internal/vk-user/listener/reload-account", async (request, reply) => handleReloadAccount(fastify, request, reply));
}
//# sourceMappingURL=index.js.map