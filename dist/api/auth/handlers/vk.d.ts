import { FastifyInstance, FastifyReply } from "fastify";
/**
 * POST /vk/auth - VK Mini App авторизация
 */
export declare function handleVkAuth(fastify: FastifyInstance, request: any, reply: FastifyReply): Promise<{
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
 * POST /vk/auth/vkid-login - Web login через VK ID SDK
 *
 * Фронтенд делает `Auth.exchangeCode(...)` через `@vkid/sdk`,
 * затем отправляет access_token сюда для верификации и выпуска наших JWT.
 */
export declare function handleVkIdLogin(fastify: FastifyInstance, request: any, reply: FastifyReply): Promise<{
    accessToken: string;
    refreshToken: string;
    user: {
        id: string;
        email: string;
        name: string;
        picture: string | undefined;
    };
}>;
//# sourceMappingURL=vk.d.ts.map