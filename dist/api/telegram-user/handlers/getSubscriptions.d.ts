import { FastifyInstance, FastifyReply } from "fastify";
import { AuthenticatedRequest } from "../../../middleware/auth.js";
/**
 * GET /api/tg-user/subscriptions?account_id=xxx - получить список подписок
 */
export declare function handleGetSubscriptions(fastify: FastifyInstance, request: AuthenticatedRequest, reply: FastifyReply): Promise<{
    subscriptions: {
        peer_id: string;
        peer_type: "user" | "chat" | "channel";
        title: string;
        enabled: boolean;
        workspace_id: string | null;
        role_id: string | null;
    }[];
}>;
//# sourceMappingURL=getSubscriptions.d.ts.map