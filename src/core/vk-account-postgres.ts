import { withPostgres, withTransaction } from "./postgres.js";
import { encrypt, decrypt } from "./encryption.js";

export type VkAccountStatus = "pending_auth" | "connected" | "expired";

export interface VkAccount {
  id: string;
  user_id: string;
  access_token: string; // зашифрованный
  refresh_token: string | null; // зашифрованный, опционально
  user_id_vk: number | null;
  status: VkAccountStatus;
  expires_at: Date | null;
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
 * Создаёт новый VK аккаунт для интеграции
 */
export async function createVkAccount(
  userId: string,
  accessToken: string,
  refreshToken: string | null,
  userIdVk: number | null,
  expiresAt: Date | null
): Promise<VkAccount> {
  const accountId = `vk_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  const encryptedAccessToken = encrypt(accessToken, BACKEND_SECRET);
  const encryptedRefreshToken = refreshToken
    ? encrypt(refreshToken, BACKEND_SECRET)
    : null;

  return await withTransaction(async client => {
    const result = await client.query(
      `INSERT INTO vk_accounts 
       (id, user_id, access_token, refresh_token, user_id_vk, status, expires_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       RETURNING *`,
      [
        accountId,
        userId,
        encryptedAccessToken,
        encryptedRefreshToken,
        userIdVk,
        "connected",
        expiresAt,
      ]
    );

    const row = result.rows[0];
    return {
      id: row.id,
      user_id: row.user_id,
      access_token: row.access_token,
      refresh_token: row.refresh_token,
      user_id_vk: row.user_id_vk,
      status: row.status,
      expires_at: row.expires_at,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  });
}

/**
 * Получает аккаунт по ID с проверкой ownership
 */
export async function getVkAccount(
  accountId: string,
  userId: string
): Promise<VkAccount | null> {
  return await withPostgres(async client => {
    const result = await client.query(
      `SELECT * FROM vk_accounts 
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
      access_token: row.access_token,
      refresh_token: row.refresh_token,
      user_id_vk: row.user_id_vk,
      status: row.status,
      expires_at: row.expires_at,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  });
}

/**
 * Получает все аккаунты пользователя
 */
export async function getUserVkAccounts(userId: string): Promise<VkAccount[]> {
  return await withPostgres(async client => {
    const result = await client.query(
      `SELECT * FROM vk_accounts 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [userId]
    );

    return result.rows.map(row => ({
      id: row.id,
      user_id: row.user_id,
      access_token: row.access_token,
      refresh_token: row.refresh_token,
      user_id_vk: row.user_id_vk,
      status: row.status,
      expires_at: row.expires_at,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));
  });
}

/**
 * Обновляет токен аккаунта
 */
export async function updateVkAccountToken(
  accountId: string,
  userId: string,
  accessToken: string,
  refreshToken: string | null,
  expiresAt: Date | null
): Promise<void> {
  const encryptedAccessToken = encrypt(accessToken, BACKEND_SECRET);
  const encryptedRefreshToken = refreshToken
    ? encrypt(refreshToken, BACKEND_SECRET)
    : null;

  await withPostgres(async client => {
    await client.query(
      `UPDATE vk_accounts 
       SET access_token = $1, refresh_token = $2, expires_at = $3, updated_at = NOW()
       WHERE id = $4 AND user_id = $5`,
      [
        encryptedAccessToken,
        encryptedRefreshToken,
        expiresAt,
        accountId,
        userId,
      ]
    );
  });
}

/**
 * Обновляет auth-данные аккаунта (token + user_id_vk + статус).
 * Используется для "1 пользователь = 1 vk_account" в vk-user OAuth callback.
 */
export async function updateVkAccountAuthData(
  accountId: string,
  userId: string,
  params: {
    accessToken: string;
    refreshToken: string | null;
    expiresAt: Date | null;
    userIdVk: number | null;
    status?: VkAccountStatus;
  }
): Promise<void> {
  const encryptedAccessToken = encrypt(params.accessToken, BACKEND_SECRET);
  const encryptedRefreshToken = params.refreshToken
    ? encrypt(params.refreshToken, BACKEND_SECRET)
    : null;

  await withPostgres(async client => {
    await client.query(
      `UPDATE vk_accounts
       SET access_token = $1,
           refresh_token = $2,
           expires_at = $3,
           user_id_vk = $4,
           status = $5,
           updated_at = NOW()
       WHERE id = $6 AND user_id = $7`,
      [
        encryptedAccessToken,
        encryptedRefreshToken,
        params.expiresAt,
        params.userIdVk,
        params.status ?? "connected",
        accountId,
        userId,
      ]
    );
  });
}

/**
 * MVP правило: 1 пользователь -> 1 VK аккаунт для автоответов.
 * Если аккаунт уже есть, обновляем токены и возвращаем его, иначе создаём новый.
 */
export async function upsertUserVkAccount(params: {
  userId: string;
  accessToken: string;
  refreshToken: string | null;
  userIdVk: number | null;
  expiresAt: Date | null;
}): Promise<VkAccount> {
  const accounts = await getUserVkAccounts(params.userId);
  const primary = accounts[0];

  if (!primary) {
    return createVkAccount(
      params.userId,
      params.accessToken,
      params.refreshToken,
      params.userIdVk,
      params.expiresAt
    );
  }

  // Обновляем самый свежий аккаунт
  await updateVkAccountAuthData(primary.id, params.userId, {
    accessToken: params.accessToken,
    refreshToken: params.refreshToken,
    expiresAt: params.expiresAt,
    userIdVk: params.userIdVk,
    status: "connected",
  });

  // Для простоты MVP удаляем все остальные аккаунты пользователя
  if (accounts.length > 1) {
    await withPostgres(async client => {
      await client.query(
        `DELETE FROM vk_accounts
         WHERE user_id = $1 AND id <> $2`,
        [params.userId, primary.id]
      );
    });
  }

  const updated = await getVkAccount(primary.id, params.userId);
  if (!updated) {
    throw new Error("Failed to load updated VK account");
  }
  return updated;
}

/**
 * Обновляет статус аккаунта
 */
export async function updateVkAccountStatus(
  accountId: string,
  userId: string,
  status: VkAccountStatus
): Promise<void> {
  await withPostgres(async client => {
    await client.query(
      `UPDATE vk_accounts 
       SET status = $1, updated_at = NOW()
       WHERE id = $2 AND user_id = $3`,
      [status, accountId, userId]
    );
  });
}

/**
 * Расшифровывает данные аккаунта
 */
export function decryptVkAccount(account: VkAccount): {
  access_token: string;
  refresh_token: string | null;
} {
  const accessToken = decrypt(account.access_token, BACKEND_SECRET);
  const refreshToken = account.refresh_token
    ? decrypt(account.refresh_token, BACKEND_SECRET)
    : null;

  return { access_token: accessToken, refresh_token: refreshToken };
}

/**
 * Удаляет аккаунт
 */
export async function deleteVkAccount(
  accountId: string,
  userId: string
): Promise<void> {
  await withPostgres(async client => {
    await client.query(
      `DELETE FROM vk_accounts 
       WHERE id = $1 AND user_id = $2`,
      [accountId, userId]
    );
  });
}

// ---------------- Subscriptions ----------------

export interface VkSubscription {
  id: string;
  vk_account_id: string;
  peer_id: string;
  peer_type: "user" | "chat" | "group";
  title: string;
  enabled: boolean;
  workspace_id: string | null;
  role_id: string | null;
  mention_only: boolean;
  next_allowed_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export async function listVkSubscriptions(
  accountId: string,
  userId: string
): Promise<VkSubscription[]> {
  const account = await getVkAccount(accountId, userId);
  if (!account) {
    throw new Error("Account not found");
  }

  return await withPostgres(async client => {
    const res = await client.query(
      `SELECT * FROM vk_subscriptions
       WHERE vk_account_id = $1
       ORDER BY created_at DESC`,
      [accountId]
    );

    return res.rows.map(row => ({
      id: row.id,
      vk_account_id: row.vk_account_id,
      peer_id: String(row.peer_id),
      peer_type: row.peer_type,
      title: row.title,
      enabled: row.enabled,
      workspace_id: row.workspace_id || null,
      role_id: row.role_id || null,
      mention_only: row.mention_only ?? true,
      next_allowed_at: row.next_allowed_at || null,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));
  });
}

export async function upsertVkSubscriptions(
  accountId: string,
  userId: string,
  items: Array<{
    peer_id: string;
    peer_type: "user" | "chat" | "group";
    title: string;
    enabled?: boolean | null;
    workspace_id?: string | null;
    role_id?: string | null;
    mention_only?: boolean | null;
  }>
): Promise<void> {
  const account = await getVkAccount(accountId, userId);
  if (!account) {
    throw new Error("Account not found");
  }

  await withTransaction(async client => {
    for (const it of items) {
      const isDirect = it.peer_type === "user";
      const mentionOnly = isDirect ? false : (it.mention_only ?? true);

      await client.query(
        `INSERT INTO vk_subscriptions 
         (id, vk_account_id, peer_id, peer_type, title, enabled, workspace_id, role_id, mention_only, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
         ON CONFLICT (vk_account_id, peer_id) 
         DO UPDATE SET 
           title = EXCLUDED.title,
           enabled = EXCLUDED.enabled,
           workspace_id = EXCLUDED.workspace_id,
           role_id = EXCLUDED.role_id,
           mention_only = EXCLUDED.mention_only,
           updated_at = NOW()`,
        [
          `vk_sub_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          accountId,
          it.peer_id,
          it.peer_type,
          it.title,
          it.enabled ?? true,
          it.workspace_id || null,
          it.role_id || null,
          mentionOnly,
        ]
      );
    }
  });
}

/**
 * Проверка, можно ли отправить сообщение (rate limiting)
 */
export async function canSendMessage(
  accountId: string,
  peerId: string
): Promise<boolean> {
  return await withPostgres(async client => {
    const result = await client.query(
      `SELECT next_allowed_at FROM vk_subscriptions
       WHERE vk_account_id = $1 AND peer_id = $2`,
      [accountId, peerId]
    );

    if (result.rows.length === 0) {
      return true; // Если подписки нет, разрешаем (но это не должно происходить)
    }

    const nextAllowedAt = result.rows[0].next_allowed_at;
    if (!nextAllowedAt) {
      return true;
    }

    return new Date() >= new Date(nextAllowedAt);
  });
}

/**
 * Обновление времени блокировки (rate limiting)
 */
export async function updateNextAllowedAt(
  accountId: string,
  peerId: string,
  seconds: number
): Promise<void> {
  await withPostgres(async client => {
    await client.query(
      `UPDATE vk_subscriptions 
       SET next_allowed_at = NOW() + INTERVAL '${seconds} seconds', updated_at = NOW()
       WHERE vk_account_id = $1 AND peer_id = $2`,
      [accountId, peerId]
    );
  });
}
