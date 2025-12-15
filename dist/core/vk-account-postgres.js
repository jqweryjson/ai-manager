import { withPostgres, withTransaction } from "./postgres.js";
import { encrypt, decrypt } from "./encryption.js";
const BACKEND_SECRET = process.env.BACKEND_SECRET || "";
if (!BACKEND_SECRET) {
    console.warn("⚠️  BACKEND_SECRET не установлен, шифрование не будет работать");
}
/**
 * Создаёт новый VK аккаунт для интеграции
 */
export async function createVkAccount(userId, accessToken, refreshToken, userIdVk, expiresAt) {
    const accountId = `vk_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const encryptedAccessToken = encrypt(accessToken, BACKEND_SECRET);
    const encryptedRefreshToken = refreshToken
        ? encrypt(refreshToken, BACKEND_SECRET)
        : null;
    return await withTransaction(async (client) => {
        const result = await client.query(`INSERT INTO vk_accounts 
       (id, user_id, access_token, refresh_token, user_id_vk, status, expires_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       RETURNING *`, [
            accountId,
            userId,
            encryptedAccessToken,
            encryptedRefreshToken,
            userIdVk,
            "connected",
            expiresAt,
        ]);
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
export async function getVkAccount(accountId, userId) {
    return await withPostgres(async (client) => {
        const result = await client.query(`SELECT * FROM vk_accounts 
       WHERE id = $1 AND user_id = $2`, [accountId, userId]);
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
export async function getUserVkAccounts(userId) {
    return await withPostgres(async (client) => {
        const result = await client.query(`SELECT * FROM vk_accounts 
       WHERE user_id = $1 
       ORDER BY created_at DESC`, [userId]);
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
export async function updateVkAccountToken(accountId, userId, accessToken, refreshToken, expiresAt) {
    const encryptedAccessToken = encrypt(accessToken, BACKEND_SECRET);
    const encryptedRefreshToken = refreshToken
        ? encrypt(refreshToken, BACKEND_SECRET)
        : null;
    await withPostgres(async (client) => {
        await client.query(`UPDATE vk_accounts 
       SET access_token = $1, refresh_token = $2, expires_at = $3, updated_at = NOW()
       WHERE id = $4 AND user_id = $5`, [
            encryptedAccessToken,
            encryptedRefreshToken,
            expiresAt,
            accountId,
            userId,
        ]);
    });
}
/**
 * Обновляет статус аккаунта
 */
export async function updateVkAccountStatus(accountId, userId, status) {
    await withPostgres(async (client) => {
        await client.query(`UPDATE vk_accounts 
       SET status = $1, updated_at = NOW()
       WHERE id = $2 AND user_id = $3`, [status, accountId, userId]);
    });
}
/**
 * Расшифровывает данные аккаунта
 */
export function decryptVkAccount(account) {
    const accessToken = decrypt(account.access_token, BACKEND_SECRET);
    const refreshToken = account.refresh_token
        ? decrypt(account.refresh_token, BACKEND_SECRET)
        : null;
    return { access_token: accessToken, refresh_token: refreshToken };
}
/**
 * Удаляет аккаунт
 */
export async function deleteVkAccount(accountId, userId) {
    await withPostgres(async (client) => {
        await client.query(`DELETE FROM vk_accounts 
       WHERE id = $1 AND user_id = $2`, [accountId, userId]);
    });
}
export async function listVkSubscriptions(accountId, userId) {
    const account = await getVkAccount(accountId, userId);
    if (!account) {
        throw new Error("Account not found");
    }
    return await withPostgres(async (client) => {
        const res = await client.query(`SELECT * FROM vk_subscriptions
       WHERE vk_account_id = $1
       ORDER BY created_at DESC`, [accountId]);
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
export async function upsertVkSubscriptions(accountId, userId, items) {
    const account = await getVkAccount(accountId, userId);
    if (!account) {
        throw new Error("Account not found");
    }
    await withTransaction(async (client) => {
        for (const it of items) {
            const isDirect = it.peer_type === "user";
            const mentionOnly = isDirect ? false : (it.mention_only ?? true);
            await client.query(`INSERT INTO vk_subscriptions 
         (id, vk_account_id, peer_id, peer_type, title, enabled, workspace_id, role_id, mention_only, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
         ON CONFLICT (vk_account_id, peer_id) 
         DO UPDATE SET 
           title = EXCLUDED.title,
           enabled = EXCLUDED.enabled,
           workspace_id = EXCLUDED.workspace_id,
           role_id = EXCLUDED.role_id,
           mention_only = EXCLUDED.mention_only,
           updated_at = NOW()`, [
                `vk_sub_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                accountId,
                it.peer_id,
                it.peer_type,
                it.title,
                it.enabled ?? true,
                it.workspace_id || null,
                it.role_id || null,
                mentionOnly,
            ]);
        }
    });
}
/**
 * Проверка, можно ли отправить сообщение (rate limiting)
 */
export async function canSendMessage(accountId, peerId) {
    return await withPostgres(async (client) => {
        const result = await client.query(`SELECT next_allowed_at FROM vk_subscriptions
       WHERE vk_account_id = $1 AND peer_id = $2`, [accountId, peerId]);
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
export async function updateNextAllowedAt(accountId, peerId, seconds) {
    await withPostgres(async (client) => {
        await client.query(`UPDATE vk_subscriptions 
       SET next_allowed_at = NOW() + INTERVAL '${seconds} seconds', updated_at = NOW()
       WHERE vk_account_id = $1 AND peer_id = $2`, [accountId, peerId]);
    });
}
//# sourceMappingURL=vk-account-postgres.js.map