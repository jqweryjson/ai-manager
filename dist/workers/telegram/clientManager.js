import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import { NewMessage } from "telegram/events/index.js";
import { getTelegramAccount, decryptTelegramAccount, } from "../../core/telegram-account-postgres.js";
import { getPostgresPool } from "../../core/postgres.js";
export class TelegramClientManager {
    getNewMessageConfig() {
        return new NewMessage({});
    }
    async getActiveAccounts() {
        const pool = getPostgresPool();
        const result = await pool.query(`
      SELECT DISTINCT ta.id, ta.user_id
      FROM telegram_accounts ta
      INNER JOIN telegram_subscriptions ts ON ts.telegram_account_id = ta.id
      WHERE ta.status = 'connected'
        AND ts.enabled = true
    `);
        return result.rows;
    }
    async createClient(accountId, userId) {
        const account = await getTelegramAccount(accountId, userId);
        if (!account || account.status !== "connected" || !account.session) {
            console.warn(`⚠️  Телеграм аккаунт ${accountId} недоступен`);
            return null;
        }
        const decrypted = decryptTelegramAccount(account);
        if (!decrypted.session) {
            console.error(`❌ Нет сессии для ${accountId}`);
            return null;
        }
        const session = new StringSession(decrypted.session);
        const client = new TelegramClient(session, decrypted.apiId, decrypted.apiHash, {
            connectionRetries: Infinity,
            autoReconnect: true,
            retryDelay: 1000,
            useWSS: false,
            timeout: 10,
        });
        await client.connect();
        if (!client.connected) {
            throw new Error("Не удалось подключиться к Telegram");
        }
        return {
            client,
            accountId,
            userId,
            phone: account.phone || "unknown",
        };
    }
}
//# sourceMappingURL=clientManager.js.map