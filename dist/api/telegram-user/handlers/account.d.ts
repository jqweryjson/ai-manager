import { FastifyInstance, FastifyReply } from "fastify";
import { AuthenticatedRequest } from "../../../middleware/auth.js";
/**
 * GET /api/tg-user/status - статус аккаунтов
 */
export declare function handleStatus(fastify: FastifyInstance, request: AuthenticatedRequest, reply: FastifyReply): Promise<{
    accounts: {
        id: string;
        phone: string | null;
        status: import("../../../core/telegram-account-postgres.js").TelegramAccountStatus;
        flood_wait_until: Date | null;
        created_at: Date;
    }[];
}>;
/**
 * POST /api/tg-user/disconnect - отключение аккаунта
 */
export declare function handleDisconnect(fastify: FastifyInstance, request: AuthenticatedRequest, reply: FastifyReply): Promise<{
    success: boolean;
}>;
//# sourceMappingURL=account.d.ts.map