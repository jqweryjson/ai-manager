import { FastifyInstance, FastifyReply } from "fastify";
import { AuthenticatedRequest } from "../../../middleware/auth.js";
import {
  getTelegramAccount,
  upsertSubscriptions,
  listSubscriptions,
} from "../../../core/telegram-account-postgres.js";
import { SaveSubscriptionsRequestSchema } from "../schemas.js";

/**
 * POST /api/tg-user/subscriptions - сохранить/обновить подписки
 */
export async function handleSubscriptions(
  fastify: FastifyInstance,
  request: AuthenticatedRequest,
  reply: FastifyReply
) {
  try {
    const body = SaveSubscriptionsRequestSchema.parse(request.body);
    const { account_id, items } = body;

    // Проверяем ownership
    const account = await getTelegramAccount(account_id, request.userId);
    if (!account) {
      return reply.status(404).send({ error: "Account not found" });
    }

    // Сохраняем/обновляем подписки
    // Передаем null для не переданных полей, чтобы SQL мог сохранить старое значение через COALESCE
    const cleanItems = items.map(item => {
      const base = {
        peer_id: item.peer_id,
        peer_type: item.peer_type,
        title: item.title,
        enabled: item.enabled !== undefined ? item.enabled : null,
        workspace_id:
          item.workspace_id !== undefined ? item.workspace_id : null,
        role_id: item.role_id !== undefined ? item.role_id : null,
        mention_only:
          item.mention_only !== undefined ? item.mention_only : null,
        access_hash: item.access_hash !== undefined ? item.access_hash : null,
      };

      // Для личных чатов всегда принудительно mention_only = false,
      // чтобы в личке бот по умолчанию отвечал на все входящие
      if (item.peer_type === "user") {
        return { ...base, mention_only: false };
      }

      return base;
    });
    await upsertSubscriptions(account_id, request.userId, cleanItems);

    // Возвращаем актуальный список
    const subs = await listSubscriptions(account_id, request.userId);
    return { success: true, subscriptions: subs };
  } catch (error: any) {
    if (error?.name === "ZodError") {
      return reply.status(400).send({ error: error.message });
    }
    fastify.log.error(`❌ Ошибка subscriptions: ${error}`);
    return reply.status(500).send({ error: "Internal server error" });
  }
}
