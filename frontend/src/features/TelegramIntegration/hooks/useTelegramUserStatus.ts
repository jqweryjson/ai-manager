import { useQuery } from "@tanstack/react-query";
import { getStatus } from "@shared/api/telegramUser";
import { queryKeys } from "@shared/query/queryKeys";
import type { BadgeProps } from "@consta/uikit/Badge";

export type TelegramAccountStatus =
  | "pending_code"
  | "pending_2fa"
  | "connected"
  | "flood_wait"
  | "preparing";

export type IntegrationStatusLabel = {
  label: string;
  status: BadgeProps["status"];
};

interface UseTelegramUserStatusResult {
  status: TelegramAccountStatus;
  accountId: string | null;
  userPhone: string | null;
  requires2FA: boolean;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Хук для получения статуса Telegram User Bot интеграции
 * Загружает статус независимо от состояния карточки (свернута/развернута)
 */
export function useTelegramUserStatus(): UseTelegramUserStatusResult {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.telegramUser.status,
    queryFn: getStatus,
    staleTime: 30 * 1000, // 30 секунд - статус обновляется часто
    refetchOnWindowFocus: true, // Обновляем при возврате фокуса
  });

  // Определяем текущий статус на основе аккаунтов
  let status: TelegramAccountStatus = "preparing";
  let accountId: string | null = null;
  let requires2FA = false;

  if (data?.accounts && data.accounts.length > 0) {
    const connectedAccount = data.accounts.find(
      acc => acc.status === "connected"
    );
    if (connectedAccount) {
      status = "connected";
      accountId = connectedAccount.id;
    } else {
      const pendingAccount = data.accounts[0];
      status = pendingAccount.status as
        | "pending_code"
        | "pending_2fa"
        | "flood_wait";
      accountId = pendingAccount.id;
      if (pendingAccount.status === "pending_2fa") {
        requires2FA = true;
      }
    }
  }

  return {
    status,
    accountId,
    userPhone: data?.accounts?.[0]?.phone || null,
    requires2FA,
    isLoading,
    error: error as Error | null,
    refetch: () => {
      refetch();
    },
  };
}
