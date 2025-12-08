import { FastifyInstance, FastifyReply } from "fastify";
import { AuthenticatedRequest } from "../../../middleware/auth.js";
import {
  createTelegramAccount,
  getTelegramAccount,
  updateTelegramAccountSession,
  decryptTelegramAccount,
} from "../../../core/telegram-account-postgres.js";
import {
  createClient,
  sendCode,
  signIn,
  signInWithPassword,
  getSessionString,
  restoreSession,
} from "../../../core/telegram-mtproto.js";
import {
  StartConnectionSchema,
  VerifyCodeSchema,
  Verify2FASchema,
} from "../schemas.js";

/**
 * POST /api/tg-user/start - начало подключения
 */
export async function handleStart(
  fastify: FastifyInstance,
  request: AuthenticatedRequest,
  reply: FastifyReply
) {
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
      request.userId,
      api_id.toString(),
      api_hash,
      phone,
      phoneCodeHash,
      sessionString
    );

    fastify.log.info(
      `📱 Telegram аккаунт создан: ${account.id} для пользователя ${request.userId}`
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

/**
 * POST /api/tg-user/verify - проверка кода
 */
export async function handleVerify(
  fastify: FastifyInstance,
  request: AuthenticatedRequest,
  reply: FastifyReply
) {
  try {
    const body = VerifyCodeSchema.parse(request.body);
    const { account_id, code } = body;

    // Получаем аккаунт с проверкой ownership
    const account = await getTelegramAccount(account_id, request.userId);
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
        request.userId,
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
      request.userId,
      updatedSession,
      "connected"
    );

    fastify.log.info(
      `✅ Telegram аккаунт подключен: ${account_id} для пользователя ${request.userId}`
    );

    // Сигнализируем Telegram Service, чтобы он начал слушать новый аккаунт
    try {
      const backendPort = Number(process.env.BACKEND_PORT) || 4001;
      const backendUrl =
        process.env.BACKEND_INTERNAL_URL || `http://localhost:${backendPort}`;

      await fetch(
        `${backendUrl}/api/internal/tg-user/listener/reload-account`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            account_id,
            user_id: request.userId,
          }),
        }
      );

      fastify.log.info(
        `📡 Отправлен запрос reload-account для Telegram Service (verify): ${account_id}`
      );
    } catch (notifyError) {
      fastify.log.error(
        `⚠️  Не удалось отправить reload-account для Telegram Service (verify): ${notifyError}`
      );
    }

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

/**
 * POST /api/tg-user/2fa - завершение авторизации с 2FA
 */
export async function handle2FA(
  fastify: FastifyInstance,
  request: AuthenticatedRequest,
  reply: FastifyReply
) {
  try {
    const body = Verify2FASchema.parse(request.body);
    const { account_id, password } = body;

    // Получаем аккаунт с проверкой ownership
    const account = await getTelegramAccount(account_id, request.userId);
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
      request.userId,
      updatedSession,
      "connected"
    );

    fastify.log.info(
      `✅ Telegram аккаунт подключен с 2FA: ${account_id} для пользователя ${request.userId}`
    );

    // Сигнализируем Telegram Service, чтобы он начал слушать новый аккаунт
    try {
      const backendPort = Number(process.env.BACKEND_PORT) || 4001;
      const backendUrl =
        process.env.BACKEND_INTERNAL_URL || `http://localhost:${backendPort}`;

      await fetch(
        `${backendUrl}/api/internal/tg-user/listener/reload-account`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            account_id,
            user_id: request.userId,
          }),
        }
      );

      fastify.log.info(
        `📡 Отправлен запрос reload-account для Telegram Service (2FA): ${account_id}`
      );
    } catch (notifyError) {
      fastify.log.error(
        `⚠️  Не удалось отправить reload-account для Telegram Service (2FA): ${notifyError}`
      );
    }

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
