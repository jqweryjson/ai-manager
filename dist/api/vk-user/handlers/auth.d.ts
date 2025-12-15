import { FastifyInstance, FastifyReply } from "fastify";
import { AuthenticatedRequest } from "../../../middleware/auth.js";
/**
 * POST /api/vk-user/start - начало OAuth авторизации
 * Возвращает OAuth URL для редиректа
 */
export declare function handleStart(fastify: FastifyInstance, request: AuthenticatedRequest, reply: FastifyReply): Promise<{
    oauth_url: string;
}>;
/**
 * GET /api/vk-user/callback - OAuth callback
 * Обрабатывает code и создает аккаунт
 */
export declare function handleCallback(fastify: FastifyInstance, request: any, reply: FastifyReply): Promise<never>;
//# sourceMappingURL=auth.d.ts.map