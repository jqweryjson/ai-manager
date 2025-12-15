import { FastifyInstance, FastifyReply } from "fastify";
import { AuthenticatedRequest } from "../../../middleware/auth.js";
/**
 * POST /api/vk-user/send - отправка сообщения в VK
 */
export declare function handleSendMessage(fastify: FastifyInstance, request: AuthenticatedRequest, reply: FastifyReply): Promise<{
    success: boolean;
}>;
//# sourceMappingURL=send.d.ts.map