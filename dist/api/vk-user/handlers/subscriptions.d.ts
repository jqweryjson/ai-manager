import { FastifyInstance, FastifyReply } from "fastify";
import { AuthenticatedRequest } from "../../../middleware/auth.js";
/**
 * GET /api/vk-user/subscriptions?account_id=xxx - получить список подписок
 */
export declare function handleGetSubscriptions(fastify: FastifyInstance, request: AuthenticatedRequest, reply: FastifyReply): Promise<{
    subscriptions: {
        peer_id: string;
        peer_type: "user" | "chat" | "group";
        title: string;
        enabled: boolean;
        workspace_id: string | null;
        role_id: string | null;
        mention_only: boolean;
    }[];
}>;
/**
 * POST /api/vk-user/subscriptions - сохранить/обновить подписки
 */
export declare function handleSubscriptions(fastify: FastifyInstance, request: AuthenticatedRequest, reply: FastifyReply): Promise<{
    success: boolean;
    subscriptions: import("../../../core/vk-account-postgres.js").VkSubscription[];
}>;
//# sourceMappingURL=subscriptions.d.ts.map