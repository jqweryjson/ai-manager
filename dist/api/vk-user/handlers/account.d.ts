import { FastifyInstance, FastifyReply } from "fastify";
import { AuthenticatedRequest } from "../../../middleware/auth.js";
/**
 * GET /api/vk-user/status - статус аккаунтов пользователя
 */
export declare function handleStatus(fastify: FastifyInstance, request: AuthenticatedRequest, reply: FastifyReply): Promise<{
    accounts: {
        id: string;
        user_id_vk: number | null;
        status: import("../../../core/vk-account-postgres.js").VkAccountStatus;
        expires_at: Date | null;
        created_at: Date;
    }[];
}>;
/**
 * POST /api/vk-user/disconnect - отключение аккаунта
 */
export declare function handleDisconnect(fastify: FastifyInstance, request: AuthenticatedRequest, reply: FastifyReply): Promise<{
    success: boolean;
}>;
//# sourceMappingURL=account.d.ts.map