import { getVkAccount, decryptVkAccount, } from "../../../core/vk-account-postgres.js";
import { getConversations } from "../../../core/vk-api.js";
/**
 * GET /api/vk-user/conversations - список диалогов аккаунта с пагинацией
 */
export async function handleConversations(fastify, request, reply) {
    const req = request;
    try {
        const accountId = request.query?.account_id;
        if (!accountId) {
            return reply.status(400).send({ error: "account_id is required" });
        }
        // Проверяем ownership и достаём аккаунт
        const account = await getVkAccount(accountId, req.userId);
        if (!account) {
            return reply.status(404).send({ error: "Account not found" });
        }
        if (account.status !== "connected") {
            return reply.status(400).send({
                error: "Account is not connected. Complete authorization first.",
            });
        }
        // Параметры пагинации
        const offset = parseInt(request.query?.offset || "0", 10);
        const count = parseInt(request.query?.count || "20", 10);
        // Расшифровываем access_token
        const { access_token } = decryptVkAccount(account);
        // Получаем диалоги через VK API
        const result = await getConversations(access_token, offset, count);
        // Форматируем диалоги в единый формат
        const dialogs = result.items.map(conv => {
            const peerId = conv.peer.id.toString();
            const peerType = conv.peer.type === "user"
                ? "user"
                : conv.peer.type === "chat"
                    ? "chat"
                    : "group";
            // Получаем название из chat_settings или используем peer_id
            const title = conv.chat_settings?.title ||
                (peerType === "user" ? `User ${peerId}` : `Chat ${peerId}`);
            return {
                peer_id: peerId,
                peer_type: peerType,
                title,
                unread_count: conv.in_read < conv.out_read ? 0 : conv.in_read - conv.out_read,
            };
        });
        return {
            account_id: accountId,
            dialogs,
            has_more: offset + count < result.count,
            next_offset: offset + count,
        };
    }
    catch (error) {
        fastify.log.error(`❌ Ошибка получения диалогов: ${error}`);
        // Обработка ошибок VK API
        if (error.message?.includes("error_code: 5")) {
            // Invalid token
            return reply.status(401).send({ error: "Invalid access token" });
        }
        return reply.status(500).send({ error: "Internal server error" });
    }
}
//# sourceMappingURL=conversations.js.map