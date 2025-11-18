import { FastifyRequest, FastifyReply } from "fastify";
import type { JWTPayload } from "../types/auth.js";
export interface AuthenticatedRequest extends FastifyRequest {
    userId: string;
    email: string;
}
export declare function authMiddleware(request: FastifyRequest, reply: FastifyReply): Promise<undefined>;
export declare function generateAccessToken(payload: JWTPayload): string;
export declare function generateRefreshToken(payload: JWTPayload): string;
//# sourceMappingURL=auth.d.ts.map