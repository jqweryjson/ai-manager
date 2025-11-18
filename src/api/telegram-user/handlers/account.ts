import { FastifyInstance, FastifyReply } from "fastify";
import { AuthenticatedRequest } from "../../../middleware/auth.js";
import {
  getUserTelegramAccounts,
  getTelegramAccount,
  deleteTelegramAccount,
} from "../../../core/telegram-account-postgres.js";
import { DisconnectSchema } from "../schemas.js";

/**
 * GET /api/tg-user/status - статус аккаунтов
 */
export async function handleStatus(
  fastify: FastifyInstance,
  request: AuthenticatedRequest,
  reply: FastifyReply
) {
  try {
    const accounts = await getUserTelegramAccounts(request.userId);

    return {
      accounts: accounts.map(acc => ({
        id: acc.id,
        phone: acc.phone,
        status: acc.status,
        flood_wait_until: acc.flood_wait_until,
        created_at: acc.created_at,
      })),
    };
  } catch (error) {
    fastify.log.error(`❌ Ошибка get status: ${error}`);
    return reply.status(500).send({ error: "Internal server error" });
  }
}

/**
 * POST /api/tg-user/disconnect - отключение аккаунта
 */
export async function handleDisconnect(
  fastify: FastifyInstance,
  request: AuthenticatedRequest,
  reply: FastifyReply
) {
  try {
    const body = DisconnectSchema.parse(request.body);
    const { account_id } = body;

    // Проверяем ownership
    const account = await getTelegramAccount(account_id, request.userId);
    if (!account) {
      return reply.status(404).send({ error: "Account not found" });
    }

    // Удаляем аккаунт (CASCADE удалит подписки)
    await deleteTelegramAccount(account_id, request.userId);

    fastify.log.info(
      `🗑️  Telegram аккаунт удалён: ${account_id} для пользователя ${request.userId}`
    );

    return {
      success: true,
    };
  } catch (error) {
    fastify.log.error(`❌ Ошибка disconnect: ${error}`);
    return reply.status(500).send({ error: "Internal server error" });
  }
}
