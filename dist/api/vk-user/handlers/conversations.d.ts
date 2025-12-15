import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
/**
 * GET /api/vk-user/conversations - список диалогов аккаунта с пагинацией
 */
export declare function handleConversations(fastify: FastifyInstance, request: FastifyRequest, reply: FastifyReply): Promise<{
    account_id: string;
    dialogs: {
        peer_id: string;
        peer_type: string;
        title: string;
        unread_count: number;
    }[];
    has_more: boolean;
    next_offset: number;
}>;
//# sourceMappingURL=conversations.d.ts.map