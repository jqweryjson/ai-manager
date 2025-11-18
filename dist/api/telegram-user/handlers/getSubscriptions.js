import { getTelegramAccount, listSubscriptions, } from "../../../core/telegram-account-postgres.js";
/**
 * GET /api/tg-user/subscriptions?account_id=xxx - получить список подписок
 */
export async function handleGetSubscriptions(fastify, request, reply) {
    try {
        const { account_id } = request.query;
        if (!account_id) {
            return reply.status(400).send({ error: "account_id is required" });
        }
        // Проверяем ownership
        const account = await getTelegramAccount(account_id, request.userId);
        if (!account) {
            return reply.status(404).send({ error: "Account not found" });
        }
        // Получаем подписки из БД
        const subscriptions = await listSubscriptions(account_id, request.userId);
        return {
            subscriptions: subscriptions.map(sub => ({
                peer_id: sub.peer_id,
                peer_type: sub.peer_type,
                title: sub.title,
                enabled: sub.enabled,
                workspace_id: sub.workspace_id,
                role_id: sub.role_id,
            })),
        };
    }
    catch (error) {
        fastify.log.error(`❌ Ошибка get subscriptions: ${error}`);
        return reply.status(500).send({ error: "Internal server error" });
    }
}
//# sourceMappingURL=getSubscriptions.js.map