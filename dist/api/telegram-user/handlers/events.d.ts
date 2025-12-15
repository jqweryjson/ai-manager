import { FastifyInstance, FastifyReply } from "fastify";
/**
 * POST /internal/tg-user/events - обработка событий от Telegram Listener
 * Внутренний endpoint, без аутентификации (доступен только внутри Docker сети)
 */
export declare function handleTelegramEvent(fastify: FastifyInstance, request: any, reply: FastifyReply): Promise<{
    success: boolean;
    skipped: boolean;
    reason: string;
    message?: never;
    error?: never;
    processed?: never;
    answer?: never;
    stats?: never;
} | {
    success: boolean;
    skipped: boolean;
    reason: string;
    message: string;
    error?: never;
    processed?: never;
    answer?: never;
    stats?: never;
} | {
    success: boolean;
    error: string;
    skipped?: never;
    reason?: never;
    message?: never;
    processed?: never;
    answer?: never;
    stats?: never;
} | {
    success: boolean;
    processed: boolean;
    answer: string;
    stats: {
        chat_ms: number;
    };
    skipped?: never;
    reason?: never;
    message?: never;
    error?: never;
}>;
//# sourceMappingURL=events.d.ts.map