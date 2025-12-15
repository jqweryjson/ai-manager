import { getUserVkAccounts, getVkAccount, deleteVkAccount, } from "../../../core/vk-account-postgres.js";
import { z } from "zod";
const DisconnectSchema = z.object({
    account_id: z.string().min(1),
});
/**
 * GET /api/vk-user/status - статус аккаунтов пользователя
 */
export async function handleStatus(fastify, request, reply) {
    try {
        const accounts = await getUserVkAccounts(request.userId);
        return {
            accounts: accounts.map(acc => ({
                id: acc.id,
                user_id_vk: acc.user_id_vk,
                status: acc.status,
                expires_at: acc.expires_at,
                created_at: acc.created_at,
            })),
        };
    }
    catch (error) {
        fastify.log.error(`❌ Ошибка получения статуса: ${error}`);
        return reply.status(500).send({ error: "Internal server error" });
    }
}
/**
 * POST /api/vk-user/disconnect - отключение аккаунта
 */
export async function handleDisconnect(fastify, request, reply) {
    try {
        const body = DisconnectSchema.parse(request.body);
        const { account_id } = body;
        // Проверка ownership
        const account = await getVkAccount(account_id, request.userId);
        if (!account) {
            return reply.status(404).send({ error: "Account not found" });
        }
        // Удаление аккаунта (CASCADE удалит подписки)
        await deleteVkAccount(account_id, request.userId);
        fastify.log.info(`✅ VK аккаунт отключен: ${account_id} для пользователя ${request.userId}`);
        return { success: true };
    }
    catch (error) {
        if (error?.name === "ZodError") {
            return reply.status(400).send({ error: error.message });
        }
        fastify.log.error(`❌ Ошибка отключения: ${error}`);
        return reply.status(500).send({ error: "Internal server error" });
    }
}
//# sourceMappingURL=account.js.map