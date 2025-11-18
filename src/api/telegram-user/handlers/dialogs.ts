import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { AuthenticatedRequest } from "../../../middleware/auth.js";
import {
  getTelegramAccount,
  decryptTelegramAccount,
} from "../../../core/telegram-account-postgres.js";
import {
  restoreSession,
  getDialogsSummary,
  getUserContacts,
  getUserDialogs,
} from "../../../core/telegram-mtproto.js";
import { getAccountIdFromRequest } from "../utils.js";

/**
 * GET /api/tg-user/dialogs - список диалогов аккаунта с пагинацией
 */
export async function handleDialogs(
  fastify: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply
) {
  const req = request as AuthenticatedRequest;
  try {
    // account_id опционален, если не передан — берём connected или первый доступный
    const accountId = await getAccountIdFromRequest(
      req.userId,
      (request.query as any)?.account_id
    );

    if (!accountId) {
      return reply.status(400).send({ error: "No accounts available" });
    }

    // Проверяем ownership и достаём аккаунт
    const account = await getTelegramAccount(accountId, req.userId);
    if (!account) {
      return reply.status(404).send({ error: "Account not found" });
    }

    // Для получения диалогов нужна валидная сессия
    if (!account.session || account.status !== "connected") {
      return reply.status(400).send({
        error:
          "Account is not connected or session is missing. Complete authorization first.",
      });
    }

    // Параметры пагинации
    const limit = parseInt((request.query as any)?.limit || "50", 10);
    const offsetDateStr = (request.query as any)?.offset_date;
    const offsetDate = offsetDateStr ? new Date(offsetDateStr) : undefined;

    const { apiId, apiHash, session } = decryptTelegramAccount(account);
    const client = restoreSession(session as string, apiId, apiHash);
    const result = await getDialogsSummary(client, limit, offsetDate);

    return {
      account_id: accountId,
      dialogs: result.dialogs,
      has_more: result.hasMore,
      next_offset_date: result.nextOffsetDate,
    };
  } catch (error) {
    fastify.log.error(`❌ Ошибка dialogs: ${error}`);
    return reply.status(500).send({ error: "Internal server error" });
  }
}

/**
 * GET /api/tg-user/search-contacts - поиск контактов по имени
 */
export async function handleContacts(
  fastify: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply
) {
  const req = request as AuthenticatedRequest;
  try {
    // account_id опционален
    const accountId = await getAccountIdFromRequest(
      req.userId,
      (request.query as any)?.account_id
    );

    if (!accountId) {
      return reply.status(400).send({ error: "No accounts available" });
    }

    const account = await getTelegramAccount(accountId, req.userId);
    if (!account) {
      return reply.status(404).send({ error: "Account not found" });
    }

    if (!account.session || account.status !== "connected") {
      return reply.status(400).send({
        error:
          "Account is not connected or session is missing. Complete authorization first.",
      });
    }

    const { apiId, apiHash, session } = decryptTelegramAccount(account);
    const client = restoreSession(session as string, apiId, apiHash);
    const dialogs = await getUserContacts(client);

    return {
      account_id: accountId,
      dialogs,
    };
  } catch (error) {
    fastify.log.error(`❌ Ошибка get contacts: ${error}`);
    return reply.status(500).send({ error: "Internal server error" });
  }
}

/**
 * GET /api/tg-user/search-chats - поиск чатов/групп/каналов по названию
 */
export async function handleAllDialogs(
  fastify: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply
) {
  const req = request as AuthenticatedRequest;
  try {
    // account_id опционален
    const accountId = await getAccountIdFromRequest(
      req.userId,
      (request.query as any)?.account_id
    );

    if (!accountId) {
      return reply.status(400).send({ error: "No accounts available" });
    }

    const account = await getTelegramAccount(accountId, req.userId);
    if (!account) {
      return reply.status(404).send({ error: "Account not found" });
    }

    if (!account.session || account.status !== "connected") {
      return reply.status(400).send({
        error:
          "Account is not connected or session is missing. Complete authorization first.",
      });
    }

    const limit = parseInt((request.query as any)?.limit || "1000", 10);
    const { apiId, apiHash, session } = decryptTelegramAccount(account);
    const client = restoreSession(session as string, apiId, apiHash);
    const dialogs = await getUserDialogs(client, limit);

    return {
      account_id: accountId,
      dialogs,
    };
  } catch (error) {
    fastify.log.error(`❌ Ошибка get all dialogs: ${error}`);
    return reply.status(500).send({ error: "Internal server error" });
  }
}
