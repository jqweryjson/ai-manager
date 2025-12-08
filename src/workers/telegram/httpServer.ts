import Fastify, {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
} from "fastify";

interface ListenerController {
  startListening(accountId: string, userId: string): Promise<void>;
  getStatus(): unknown;
}

interface ReloadAccountBody {
  account_id?: string;
  user_id?: string;
}

export async function startHttpServer(controller: ListenerController) {
  const isProd = process.env.NODE_ENV === "production";

  const app: FastifyInstance = Fastify({
    logger: isProd
      ? true
      : {
          transport: {
            target: "pino-pretty",
            options: {
              colorize: true,
              translateTime: "HH:MM:ss",
              ignore: "pid,hostname,time",
              singleLine: true,
              messageFormat: "{msg}",
            },
          },
        },
  });

  app.post(
    "/internal/listener/reload-account",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = (request.body || {}) as ReloadAccountBody;
      const { account_id, user_id } = body;

      if (!account_id || !user_id) {
        request.log.warn(
          `⚠️  Неверный payload для reload-account: ${JSON.stringify(body)}`
        );
        return reply.status(400).send({
          error: "invalid_payload",
          message: "account_id и user_id обязательны",
        });
      }

      try {
        await controller.startListening(account_id, user_id);
        request.log.info(
          `✅ Reload account requested: account_id=${account_id}, user_id=${user_id}`
        );

        return {
          success: true,
          account_id,
          user_id,
        };
      } catch (error) {
        request.log.error(
          `❌ Ошибка при reload-account для ${account_id}: ${error}`
        );
        return reply.status(500).send({
          error: "listener_reload_failed",
        });
      }
    }
  );

  app.get(
    "/internal/listener/status",
    async (_request: FastifyRequest, reply: FastifyReply) => {
      try {
        const status = controller.getStatus();
        return reply.send(status);
      } catch (error) {
        return reply.status(500).send({
          error: "status_failed",
        });
      }
    }
  );

  const port = Number(process.env.TELEGRAM_SERVICE_PORT) || 4002;

  try {
    await app.listen({ port, host: "0.0.0.0" });
    app.log.info(`📡 Telegram Service HTTP API запущен на порту ${port}`);
  } catch (error) {
    app.log.error(
      `❌ Не удалось запустить Telegram Service HTTP API: ${error}`
    );
    throw error;
  }
}
