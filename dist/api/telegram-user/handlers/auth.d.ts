import { FastifyInstance, FastifyReply } from "fastify";
import { AuthenticatedRequest } from "../../../middleware/auth.js";
/**
 * POST /api/tg-user/start - начало подключения
 */
export declare function handleStart(fastify: FastifyInstance, request: AuthenticatedRequest, reply: FastifyReply): Promise<{
    account_id: string;
    phone_code_hash: string;
}>;
/**
 * POST /api/tg-user/verify - проверка кода
 */
export declare function handleVerify(fastify: FastifyInstance, request: AuthenticatedRequest, reply: FastifyReply): Promise<{
    requires_2fa: boolean;
    success?: never;
    account_id?: never;
} | {
    success: boolean;
    account_id: string;
    requires_2fa?: never;
}>;
/**
 * POST /api/tg-user/2fa - завершение авторизации с 2FA
 */
export declare function handle2FA(fastify: FastifyInstance, request: AuthenticatedRequest, reply: FastifyReply): Promise<{
    success: boolean;
    account_id: string;
}>;
//# sourceMappingURL=auth.d.ts.map