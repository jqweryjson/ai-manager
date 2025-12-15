import { getVkAccount, upsertVkSubscriptions, listVkSubscriptions, } from "../../../core/vk-account-postgres.js";
import { SaveSubscriptionsSchema } from "../schemas.js";
/**
 * GET /api/vk-user/subscriptions?account_id=xxx - получить список подписок
 */
export async function handleGetSubscriptions(fastify, request, reply) {
    try {
        const { account_id } = request.query;
        if (!account_id) {
            return reply.status(400).send({ error: "account_id is required" });
        }
        // Проверяем ownership
        const account = await getVkAccount(account_id, request.userId);
        if (!account) {
            return reply.status(404).send({ error: "Account not found" });
        }
        // Получаем подписки из БД
        const subscriptions = await listVkSubscriptions(account_id, request.userId);
        return {
            subscriptions: subscriptions.map(sub => ({
                peer_id: sub.peer_id,
                peer_type: sub.peer_type,
                title: sub.title,
                enabled: sub.enabled,
                workspace_id: sub.workspace_id,
                role_id: sub.role_id,
                mention_only: sub.mention_only,
            })),
        };
    }
    catch (error) {
        fastify.log.error(`❌ Ошибка get subscriptions: ${error}`);
        return reply.status(500).send({ error: "Internal server error" });
    }
}
/**
 * POST /api/vk-user/subscriptions - сохранить/обновить подписки
 */
export async function handleSubscriptions(fastify, request, reply) {
    try {
        const body = SaveSubscriptionsSchema.parse(request.body);
        const { account_id, items } = body;
        // Проверяем ownership
        const account = await getVkAccount(account_id, request.userId);
        if (!account) {
            return reply.status(404).send({ error: "Account not found" });
        }
        // Сохраняем/обновляем подписки
        const cleanItems = items.map(item => ({
            peer_id: item.peer_id,
            peer_type: item.peer_type,
            title: item.title,
            enabled: item.enabled !== undefined ? item.enabled : null,
            workspace_id: item.workspace_id !== undefined ? item.workspace_id : null,
            role_id: item.role_id !== undefined ? item.role_id : null,
            mention_only: item.mention_only !== undefined ? item.mention_only : null,
        }));
        await upsertVkSubscriptions(account_id, request.userId, cleanItems);
        // Возвращаем актуальный список
        const subs = await listVkSubscriptions(account_id, request.userId);
        return { success: true, subscriptions: subs };
    }
    catch (error) {
        if (error?.name === "ZodError") {
            return reply.status(400).send({ error: error.message });
        }
        fastify.log.error(`❌ Ошибка subscriptions: ${error}`);
        return reply.status(500).send({ error: "Internal server error" });
    }
}
//# sourceMappingURL=subscriptions.js.map