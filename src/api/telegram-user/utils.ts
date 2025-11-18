import { getUserTelegramAccounts } from "../../core/telegram-account-postgres.js";

/**
 * Получает accountId из query параметров или выбирает connected/первый доступный аккаунт
 */
export async function getAccountIdFromRequest(
  userId: string,
  queryAccountId?: string
): Promise<string | null> {
  if (queryAccountId) {
    return queryAccountId;
  }

  const accounts = await getUserTelegramAccounts(userId);
  if (accounts.length === 0) {
    return null;
  }

  const connected = accounts.find(a => a.status === "connected");
  return connected?.id ?? accounts[0]?.id ?? null;
}
