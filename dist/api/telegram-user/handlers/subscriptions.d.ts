import { FastifyInstance, FastifyReply } from "fastify";
import { AuthenticatedRequest } from "../../../middleware/auth.js";
/**
 * POST /api/tg-user/subscriptions - сохранить/обновить подписки
 */
export declare function handleSubscriptions(fastify: FastifyInstance, request: AuthenticatedRequest, reply: FastifyReply): Promise<{
    success: boolean;
    subscriptions: import("../../../core/telegram-account-postgres.js").TelegramSubscription[];
}>;
//# sourceMappingURL=subscriptions.d.ts.map