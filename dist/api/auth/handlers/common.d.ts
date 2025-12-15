import { FastifyInstance, FastifyReply } from "fastify";
import { AuthenticatedRequest } from "../../../middleware/auth.js";
/**
 * GET /auth/me - получить текущего пользователя
 */
export declare function handleGetMe(fastify: FastifyInstance, request: AuthenticatedRequest, reply: FastifyReply): Promise<{
    id: string;
    email: string;
    name: string;
    picture: string | undefined;
}>;
/**
 * POST /auth/logout - выход
 */
export declare function handleLogout(fastify: FastifyInstance, request: AuthenticatedRequest, reply: FastifyReply): Promise<{
    success: boolean;
}>;
/**
 * POST /auth/refresh - обновление access token через refresh token
 */
export declare function handleRefresh(fastify: FastifyInstance, request: any, reply: FastifyReply): Promise<{
    accessToken: string;
}>;
//# sourceMappingURL=common.d.ts.map