import { FastifyInstance, FastifyReply } from "fastify";
/**
 * POST /tg/auth - Telegram Mini App авторизация
 */
export declare function handleTelegramAuth(fastify: FastifyInstance, request: any, reply: FastifyReply): Promise<{
    accessToken: string;
    refreshToken: string;
    user: {
        id: string;
        email: string;
        name: string;
        picture: string | undefined;
    };
}>;
/**
 * POST /auth/telegram-web - Telegram Login Widget авторизация (для веб-версии)
 */
export declare function handleTelegramWebAuth(fastify: FastifyInstance, request: any, reply: FastifyReply): Promise<{
    accessToken: string;
    refreshToken: string;
    user: {
        id: string;
        email: string;
        name: string;
        picture: string | undefined;
    };
}>;
//# sourceMappingURL=telegram.d.ts.map