import { useQuery } from "@tanstack/react-query";
import { getSubscriptions } from "@shared/api/telegramUser";
import { queryKeys } from "@shared/query/queryKeys";

export function useTelegramSubscriptions(accountId?: string) {
  return useQuery({
    queryKey: queryKeys.telegramUser.subscriptions(accountId),
    queryFn: () => {
      if (!accountId) {
        throw new Error("accountId is required");
      }
      return getSubscriptions(accountId);
    },
    enabled: !!accountId,
    staleTime: 30 * 1000, // 30 секунд
  });
}
