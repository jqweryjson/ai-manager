import { useQuery } from "@tanstack/react-query";
import { getUserContacts } from "@shared/api/telegramUser";
import { queryKeys } from "@shared/query/queryKeys";

export function useTelegramContacts(accountId?: string) {
  return useQuery({
    queryKey: queryKeys.telegramUser.contacts(accountId),
    queryFn: () => getUserContacts({ accountId }),
    staleTime: 30 * 60 * 1000, // 30 минут - контакты стабильны
    refetchOnWindowFocus: false, // Не обновлять при фокусе окна
    enabled: !!accountId, // Запрос только при наличии accountId
  });
}
