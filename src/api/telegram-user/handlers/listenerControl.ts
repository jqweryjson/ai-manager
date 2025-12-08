import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

interface ReloadAccountBody {
  account_id?: string;
  user_id?: string;
}

export async function handleReloadAccount(
  fastify: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const body = (request.body || {}) as ReloadAccountBody;
    const { account_id, user_id } = body;

    if (!account_id || !user_id) {
      fastify.log.warn(
        `⚠️  Неверный payload для /api/internal/tg-user/listener/reload-account: ${JSON.stringify(body)}`
      );
      return reply.status(400).send({
        error: "invalid_payload",
        message: "account_id и user_id обязательны",
      });
    }

    const baseUrl =
      process.env.TELEGRAM_SERVICE_URL || "http://telegram-listener:4002";

    const response = await fetch(
      `${baseUrl}/internal/listener/reload-account`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ account_id, user_id }),
      }
    );

    const data = await response.json().catch(() => ({ success: response.ok }));

    if (!response.ok) {
      fastify.log.error(
        `❌ Ошибка при вызове Telegram Service reload-account: ${response.status}`
      );
      return reply.status(response.status).send({
        error: "telegram_service_error",
        status: response.status,
        data,
      });
    }

    fastify.log.info(
      `✅ Listener reload-account успешно проксирован для account_id=${account_id}`
    );

    return reply.send(data);
  } catch (error) {
    fastify.log.error(
      `❌ Ошибка handleReloadAccount: ${error instanceof Error ? error.message : String(error)}`
    );
    return reply.status(500).send({
      error: "internal_error",
    });
  }
}
