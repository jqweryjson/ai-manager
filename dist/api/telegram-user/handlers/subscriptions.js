import { getTelegramAccount, upsertSubscriptions, listSubscriptions, } from "../../../core/telegram-account-postgres.js";
import { SubscriptionsSchema } from "../schemas.js";
/**
 * POST /api/tg-user/subscriptions - сохранить/обновить подписки
 */
export async function handleSubscriptions(fastify, request, reply) {
    try {
        const body = SubscriptionsSchema.parse(request.body);
        const { account_id, items } = body;
        // Проверяем ownership
        const account = await getTelegramAccount(account_id, request.userId);
        if (!account) {
            return reply.status(404).send({ error: "Account not found" });
        }
        // Сохраняем/обновляем подписки
        // Фильтруем undefined из enabled, workspace_id, role_id
        const cleanItems = items.map(item => ({
            peer_id: item.peer_id,
            peer_type: item.peer_type,
            title: item.title,
            ...(item.enabled !== undefined && { enabled: item.enabled }),
            ...(item.workspace_id !== undefined && {
                workspace_id: item.workspace_id,
            }),
            ...(item.role_id !== undefined && { role_id: item.role_id }),
        }));
        await upsertSubscriptions(account_id, request.userId, cleanItems);
        // Возвращаем актуальный список
        const subs = await listSubscriptions(account_id, request.userId);
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