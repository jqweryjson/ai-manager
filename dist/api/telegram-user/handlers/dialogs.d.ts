import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
/**
 * GET /api/tg-user/dialogs - список диалогов аккаунта с пагинацией
 */
export declare function handleDialogs(fastify: FastifyInstance, request: FastifyRequest, reply: FastifyReply): Promise<{
    account_id: string;
    dialogs: {
        peer_id: string;
        peer_type: "user" | "chat" | "channel";
        title: string;
        unread_count: number;
        access_hash?: string | null;
    }[];
    has_more: boolean;
    next_offset_date: string | undefined;
}>;
/**
 * GET /api/tg-user/search-contacts - поиск контактов по имени
 */
export declare function handleContacts(fastify: FastifyInstance, request: FastifyRequest, reply: FastifyReply): Promise<{
    account_id: string;
    dialogs: {
        peer_id: string;
        peer_type: "user" | "chat" | "channel";
        title: string;
        unread_count: number;
        access_hash?: string | null;
    }[];
}>;
/**
 * GET /api/tg-user/search-chats - поиск чатов/групп/каналов по названию
 */
export declare function handleAllDialogs(fastify: FastifyInstance, request: FastifyRequest, reply: FastifyReply): Promise<{
    account_id: string;
    dialogs: {
        peer_id: string;
        peer_type: "user" | "chat" | "channel";
        title: string;
        unread_count: number;
        access_hash?: string | null;
    }[];
}>;
//# sourceMappingURL=dialogs.d.ts.map