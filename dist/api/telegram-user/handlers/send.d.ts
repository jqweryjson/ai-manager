import { FastifyInstance, FastifyReply } from "fastify";
import { AuthenticatedRequest } from "../../../middleware/auth.js";
export declare function handleSendMessage(fastify: FastifyInstance, request: AuthenticatedRequest, reply: FastifyReply): Promise<{
    success: boolean;
}>;
//# sourceMappingURL=send.d.ts.map