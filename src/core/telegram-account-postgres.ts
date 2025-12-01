import { withPostgres, withTransaction } from "./postgres.js";
import { encrypt, decrypt } from "./encryption.js";

export type TelegramAccountStatus =
  | "pending_code"
  | "pending_2fa"
  | "connected"
  | "flood_wait";

export interface TelegramAccount {
  id: string;
  user_id: string;
  api_id: string; // зашифрованный
  api_hash: string; // зашифрованный
  session: string | null; // зашифрованный
  status: TelegramAccountStatus;
  phone: string | null;
  phone_code_hash: string | null;
  flood_wait_until: Date | null;
  created_at: Date;
  updated_at: Date;
}

const BACKEND_SECRET = process.env.BACKEND_SECRET || "";

if (!BACKEND_SECRET) {
  console.warn(
    "⚠️  BACKEND_SECRET не установлен, шифрование не будет работать"
  );
}

/**
 * Создаёт новый Telegram аккаунт
 */
export async function createTelegramAccount(
  userId: string,
  apiId: string,
  apiHash: string,
  phone: string,
  phoneCodeHash: string,
  sessionString?: string
): Promise<TelegramAccount> {
  const accountId = `tg_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  const encryptedApiId = encrypt(apiId, BACKEND_SECRET);
  const encryptedApiHash = encrypt(apiHash, BACKEND_SECRET);
  const encryptedSession = sessionString
    ? encrypt(sessionString, BACKEND_SECRET)
    : null;

  return await withTransaction(async client => {
    const result = await client.query(
      `INSERT INTO telegram_accounts 
       (id, user_id, api_id, api_hash, session, status, phone, phone_code_hash, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
       RETURNING *`,
      [
        accountId,
        userId,
        encryptedApiId,
        encryptedApiHash,
        encryptedSession,
        "pending_code",
        phone,
        phoneCodeHash,
      ]
    );

    const row = result.rows[0];
    return {
      id: row.id,
      user_id: row.user_id,
      api_id: row.api_id,
      api_hash: row.api_hash,
      session: row.session,
      status: row.status,
      phone: row.phone,
      phone_code_hash: row.phone_code_hash,
      flood_wait_until: row.flood_wait_until,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  });
}

/**
 * Получает аккаунт по ID с проверкой ownership
 */
export async function getTelegramAccount(
  accountId: string,
  userId: string
): Promise<TelegramAccount | null> {
  return await withPostgres(async client => {
    const result = await client.query(
      `SELECT * FROM telegram_accounts 
       WHERE id = $1 AND user_id = $2`,
      [accountId, userId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      user_id: row.user_id,
      api_id: row.api_id,
      api_hash: row.api_hash,
      session: row.session,
      status: row.status,
      phone: row.phone,
      phone_code_hash: row.phone_code_hash,
      flood_wait_until: row.flood_wait_until,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  });
}

/**
 * Получает все аккаунты пользователя
 */
export async function getUserTelegramAccounts(
  userId: string
): Promise<TelegramAccount[]> {
  return await withPostgres(async client => {
    const result = await client.query(
      `SELECT * FROM telegram_accounts 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [userId]
    );

    return result.rows.map(row => ({
      id: row.id,
      user_id: row.user_id,
      api_id: row.api_id,
      api_hash: row.api_hash,
      session: row.session,
      status: row.status,
      phone: row.phone,
      phone_code_hash: row.phone_code_hash,
      flood_wait_until: row.flood_wait_until,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));
  });
}

/**
 * Обновляет сессию и статус аккаунта
 */
export async function updateTelegramAccountSession(
  accountId: string,
  userId: string,
  sessionString: string,
  status: TelegramAccountStatus
): Promise<void> {
  const encryptedSession = encrypt(sessionString, BACKEND_SECRET);

  await withPostgres(async client => {
    await client.query(
      `UPDATE telegram_accounts 
       SET session = $1, status = $2, updated_at = NOW()
       WHERE id = $3 AND user_id = $4`,
      [encryptedSession, status, accountId, userId]
    );
  });
}

/**
 * Обновляет статус аккаунта
 */
export async function updateTelegramAccountStatus(
  accountId: string,
  userId: string,
  status: TelegramAccountStatus,
  floodWaitUntil?: Date | null
): Promise<void> {
  await withPostgres(async client => {
    await client.query(
      `UPDATE telegram_accounts 
       SET status = $1, flood_wait_until = $2, updated_at = NOW()
       WHERE id = $3 AND user_id = $4`,
      [status, floodWaitUntil || null, accountId, userId]
    );
  });
}

/**
 * Получает расшифрованные данные аккаунта
 */
export function decryptTelegramAccount(account: TelegramAccount): {
  apiId: number;
  apiHash: string;
  session: string | null;
} {
  const apiId = parseInt(decrypt(account.api_id, BACKEND_SECRET), 10);
  const apiHash = decrypt(account.api_hash, BACKEND_SECRET);
  const session = account.session
    ? decrypt(account.session, BACKEND_SECRET)
    : null;

  return { apiId, apiHash, session };
}

/**
 * Удаляет аккаунт
 */
export async function deleteTelegramAccount(
  accountId: string,
  userId: string
): Promise<void> {
  await withPostgres(async client => {
    await client.query(
      `DELETE FROM telegram_accounts 
       WHERE id = $1 AND user_id = $2`,
      [accountId, userId]
    );
  });
}

// ---------------- Subscriptions ----------------

export interface TelegramSubscription {
  id: string;
  telegram_account_id: string;
  peer_id: string;
  peer_type: "user" | "chat" | "channel";
  title: string;
  enabled: boolean;
  workspace_id: string | null;
  role_id: string | null;
  mention_only: boolean;
  access_hash: string | null;
  next_allowed_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export async function listSubscriptions(
  accountId: string,
  userId: string
): Promise<TelegramSubscription[]> {
  // ownership check via account
  const account = await getTelegramAccount(accountId, userId);
  if (!account) {
    throw new Error("Account not found");
  }
  return await withPostgres(async client => {
    const res = await client.query(
      `SELECT * FROM telegram_subscriptions
       WHERE telegram_account_id = $1
       ORDER BY created_at DESC`,
      [accountId]
    );

    return res.rows.map(row => ({
      id: row.id,
      telegram_account_id: row.telegram_account_id,
      peer_id: String(row.peer_id),
      peer_type: row.peer_type,
      title: row.title,
      enabled: row.enabled,
      workspace_id: row.workspace_id || null,
      role_id: row.role_id || null,
      mention_only: row.mention_only ?? true,
      access_hash: row.access_hash || null,
      next_allowed_at: row.next_allowed_at || null,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));
  });
}

export async function upsertSubscriptions(
  accountId: string,
  userId: string,
  items: Array<{
    peer_id: string;
    peer_type: "user" | "chat" | "channel";
    title: string;
    enabled?: boolean | null;
    workspace_id?: string | null;
    role_id?: string | null;
    mention_only?: boolean | null;
    access_hash?: string | null;
  }>
): Promise<void> {
  const account = await getTelegramAccount(accountId, userId);
  if (!account) {
    throw new Error("Account not found");
  }
  await withTransaction(async client => {
    for (const it of items) {
      // Для личных чатов (peer_type = 'user') всегда принудительно mention_only = false
      const isDirect = it.peer_type === "user";

      // Для INSERT: если поле null, используем дефолт (enabled=false, workspace_id=null, role_id=null)
      // Для UPDATE: если поле null, COALESCE сохранит старое значение
      const enabledValue = it.enabled !== null ? it.enabled : false;
      const workspaceIdValue =
        it.workspace_id !== null ? it.workspace_id : null;
      const roleIdValue = it.role_id !== null ? it.role_id : null;
      const mentionOnlyValue = isDirect
        ? false
        : it.mention_only !== null
          ? it.mention_only
          : true;
      const accessHashValue =
        typeof it.access_hash === "string" && it.access_hash.length > 0
          ? it.access_hash
          : null;

      await client.query(
        `INSERT INTO telegram_subscriptions (id, telegram_account_id, peer_id, peer_type, title, enabled, workspace_id, role_id, mention_only, access_hash, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
         ON CONFLICT (telegram_account_id, peer_id)
         DO UPDATE SET 
           title = EXCLUDED.title,
           enabled = COALESCE(EXCLUDED.enabled, telegram_subscriptions.enabled),
           workspace_id = COALESCE(EXCLUDED.workspace_id, telegram_subscriptions.workspace_id),
           role_id = COALESCE(EXCLUDED.role_id, telegram_subscriptions.role_id),
           mention_only = COALESCE(EXCLUDED.mention_only, telegram_subscriptions.mention_only),
           access_hash = COALESCE(EXCLUDED.access_hash, telegram_subscriptions.access_hash),
           updated_at = NOW()`,
        [
          `sub_${accountId}_${it.peer_id}`,
          accountId,
          parseInt(it.peer_id, 10),
          it.peer_type,
          it.title,
          enabledValue,
          workspaceIdValue,
          roleIdValue,
          mentionOnlyValue,
          accessHashValue,
        ]
      );
    }
  });
}

/**
 * Обновить время, когда можно отправить следующее сообщение в чат
 * @param accountId - ID Telegram аккаунта
 * @param peerId - ID чата
 * @param seconds - Количество секунд до следующей отправки (если null, то разблокировать)
 */
export async function updateNextAllowedAt(
  accountId: string,
  peerId: string,
  seconds: number | null
): Promise<void> {
  await withPostgres(async client => {
    const nextAllowedAt = seconds
      ? new Date(Date.now() + seconds * 1000)
      : null;

    await client.query(
      `UPDATE telegram_subscriptions
       SET next_allowed_at = $1, updated_at = NOW()
       WHERE telegram_account_id = $2 AND peer_id = $3`,
      [nextAllowedAt, accountId, parseInt(peerId, 10)]
    );
  });
}

/**
 * Проверить, можно ли отправить сообщение в чат сейчас
 * @param accountId - ID Telegram аккаунта
 * @param peerId - ID чата
 * @returns true если можно отправить, false если заблокирован
 */
export async function canSendMessage(
  accountId: string,
  peerId: string
): Promise<boolean> {
  return await withPostgres(async client => {
    const res = await client.query(
      `SELECT next_allowed_at FROM telegram_subscriptions
       WHERE telegram_account_id = $1 AND peer_id = $2`,
      [accountId, parseInt(peerId, 10)]
    );

    if (res.rows.length === 0) {
      return false; // Подписка не найдена
    }

    const nextAllowedAt = res.rows[0].next_allowed_at;

    if (!nextAllowedAt) {
      return true; // Нет блокировки
    }

    // Проверяем, прошло ли время блокировки
    return new Date() >= new Date(nextAllowedAt);
  });
}
