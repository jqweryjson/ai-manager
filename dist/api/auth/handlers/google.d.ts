import { FastifyInstance, FastifyReply } from "fastify";
/**
 * GET /auth/google - инициация Google OAuth
 */
export declare function handleGoogleAuth(fastify: FastifyInstance, request: any, reply: FastifyReply): Promise<never>;
/**
 * GET /auth/callback - Google OAuth callback
 */
export declare function handleGoogleCallback(fastify: FastifyInstance, request: any, reply: FastifyReply): Promise<never>;
//# sourceMappingURL=google.d.ts.map