import { FastifyInstance } from "fastify";
import { z } from "zod";
import { AuthenticatedRequest } from "../middleware/auth.js";
import {
  createTelegramAccount,
  getTelegramAccount,
  getUserTelegramAccounts,
  updateTelegramAccountSession,
  updateTelegramAccountStatus,
  decryptTelegramAccount,
  deleteTelegramAccount,
} from "../core/telegram-account-postgres.js";
import {
  createClient,
  sendCode,
  signIn,
  signInWithPassword,
  getSessionString,
  restoreSession,
} from "../core/telegram-mtproto.js";

const StartConnectionSchema = z.object({
  api_id: z
    .string()
    .transform(val => val.trim())
    .pipe(
      z.string().refine(
        val => {
          const num = parseInt(val, 10);
          return !isNaN(num) && num > 0;
        },
        { message: "API ID должен быть положительным числом" }
      )
    )
    .transform(val => parseInt(val, 10)),
  api_hash: z
    .string()
    .min(1)
    .transform(val => val.trim()),
  phone: z
    .string()
    .min(1)
    .transform(val => val.trim()),
});

const VerifyCodeSchema = z.object({
  account_id: z
    .string()
    .min(1)
    .transform(val => val.trim()),
  code: z
    .string()
    .min(1)
    .transform(val => val.trim()),
});

const Verify2FASchema = z.object({
  account_id: z
    .string()
    .min(1)
    .transform(val => val.trim()),
  password: z
    .string()
    .min(1)
    .transform(val => val.trim()),
});

const DisconnectSchema = z.object({
  account_id: z
    .string()
    .min(1)
    .transform(val => val.trim()),
});

export async function telegramUserRoutes(fastify: FastifyInstance) {
  // POST /api/tg-user/start - начало подключения
  fastify.post(
    "/tg-user/start",
    { preHandler: (fastify as any).authenticate },
    async (request, reply) => {
      const req = request as AuthenticatedRequest;

      try {
        const body = StartConnectionSchema.parse(request.body);
        const { api_id, api_hash, phone } = body;

        fastify.log.info(
          `📱 Начало подключения Telegram: api_id=${api_id} (type: ${typeof api_id}), phone=${phone}`
        );

        // Создаём клиент и отправляем код
        const client = createClient(api_id, api_hash);
        const phoneCodeHash = await sendCode(client, phone);

        // Сохраняем сессию и создаём аккаунт в БД
        const sessionString = getSessionString(client);
        const account = await createTelegramAccount(
          req.userId,
          api_id.toString(),
          api_hash,
          phone,
          phoneCodeHash,
          sessionString
        );

        fastify.log.info(
          `📱 Telegram аккаунт создан: ${account.id} для пользователя ${req.userId}`
        );

        return {
          account_id: account.id,
          phone_code_hash: phoneCodeHash,
        };
      } catch (error: any) {
        fastify.log.error(`❌ Ошибка start connection: ${error}`);

        // Обработка FloodWait
        if (error?.errorMessage?.includes("FLOOD_WAIT")) {
          const waitTime = error?.seconds || 86400; // по умолчанию сутки
          return reply.status(429).send({
            error: "flood_wait",
            wait_seconds: waitTime,
            message: `Подождите ${waitTime} секунд перед повторной попыткой`,
          });
        }

        // Обработка API_ID_INVALID
        if (error?.errorMessage?.includes("API_ID_INVALID")) {
          return reply.status(400).send({
            error:
              "API ID неверный. Проверьте, что вы правильно скопировали API ID из https://my.telegram.org/apps",
          });
        }

        // Обработка API_HASH_INVALID
        if (error?.errorMessage?.includes("API_HASH_INVALID")) {
          return reply.status(400).send({
            error:
              "API Hash неверный. Проверьте, что вы правильно скопировали API Hash из https://my.telegram.org/apps",
          });
        }

        return reply.status(400).send({
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  );

  // POST /api/tg-user/verify - проверка кода
  fastify.post(
    "/tg-user/verify",
    { preHandler: (fastify as any).authenticate },
    async (request, reply) => {
      const req = request as AuthenticatedRequest;

      try {
        const body = VerifyCodeSchema.parse(request.body);
        const { account_id, code } = body;

        // Получаем аккаунт с проверкой ownership
        const account = await getTelegramAccount(account_id, req.userId);
        if (!account) {
          return reply.status(404).send({ error: "Account not found" });
        }

        if (account.status !== "pending_code") {
          return reply
            .status(400)
            .send({ error: "Invalid account status for verification" });
        }

        // Расшифровываем данные и восстанавливаем клиент
        const { apiId, apiHash, session } = decryptTelegramAccount(account);
        if (!session) {
          return reply.status(400).send({ error: "Session not found" });
        }

        const client = restoreSession(session, apiId, apiHash);
        const result = await signIn(
          client,
          account.phone!,
          code,
          account.phone_code_hash!
        );

        // Обновляем сессию
        const updatedSession = getSessionString(client);

        if (result.requires2FA) {
          // Требуется 2FA
          await updateTelegramAccountSession(
            account_id,
            req.userId,
            updatedSession,
            "pending_2fa"
          );

          return {
            requires_2fa: true,
          };
        }

        // Успешная авторизация
        await updateTelegramAccountSession(
          account_id,
          req.userId,
          updatedSession,
          "connected"
        );

        fastify.log.info(
          `✅ Telegram аккаунт подключен: ${account_id} для пользователя ${req.userId}`
        );

        return {
          success: true,
          account_id,
        };
      } catch (error: any) {
        fastify.log.error(`❌ Ошибка verify code: ${error}`);

        return reply.status(400).send({
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  );

  // POST /api/tg-user/2fa - завершение авторизации с 2FA
  fastify.post(
    "/tg-user/2fa",
    { preHandler: (fastify as any).authenticate },
    async (request, reply) => {
      const req = request as AuthenticatedRequest;

      try {
        const body = Verify2FASchema.parse(request.body);
        const { account_id, password } = body;

        // Получаем аккаунт с проверкой ownership
        const account = await getTelegramAccount(account_id, req.userId);
        if (!account) {
          return reply.status(404).send({ error: "Account not found" });
        }

        if (account.status !== "pending_2fa") {
          return reply
            .status(400)
            .send({ error: "Invalid account status for 2FA" });
        }

        // Расшифровываем данные и восстанавливаем клиент
        const { apiId, apiHash, session } = decryptTelegramAccount(account);
        if (!session) {
          return reply.status(400).send({ error: "Session not found" });
        }

        const client = restoreSession(session, apiId, apiHash);
        await signInWithPassword(client, password);

        // Обновляем сессию и статус
        const updatedSession = getSessionString(client);
        await updateTelegramAccountSession(
          account_id,
          req.userId,
          updatedSession,
          "connected"
        );

        fastify.log.info(
          `✅ Telegram аккаунт подключен с 2FA: ${account_id} для пользователя ${req.userId}`
        );

        return {
          success: true,
          account_id,
        };
      } catch (error: any) {
        fastify.log.error(`❌ Ошибка 2FA: ${error}`);

        return reply.status(400).send({
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  );

  // GET /api/tg-user/status - статус аккаунтов
  fastify.get(
    "/tg-user/status",
    { preHandler: (fastify as any).authenticate },
    async (request, reply) => {
      const req = request as AuthenticatedRequest;

      try {
        const accounts = await getUserTelegramAccounts(req.userId);

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
  );

  // POST /api/tg-user/disconnect - отключение аккаунта
  fastify.post(
    "/tg-user/disconnect",
    { preHandler: (fastify as any).authenticate },
    async (request, reply) => {
      const req = request as AuthenticatedRequest;

      try {
        const body = DisconnectSchema.parse(request.body);
        const { account_id } = body;

        // Проверяем ownership
        const account = await getTelegramAccount(account_id, req.userId);
        if (!account) {
          return reply.status(404).send({ error: "Account not found" });
        }

        // Удаляем аккаунт (CASCADE удалит подписки)
        await deleteTelegramAccount(account_id, req.userId);

        fastify.log.info(
          `🗑️  Telegram аккаунт удалён: ${account_id} для пользователя ${req.userId}`
        );

        return {
          success: true,
        };
      } catch (error) {
        fastify.log.error(`❌ Ошибка disconnect: ${error}`);
        return reply.status(500).send({ error: "Internal server error" });
      }
    }
  );
}
