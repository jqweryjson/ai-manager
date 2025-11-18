import { useQuery } from "@tanstack/react-query";
import { getUserDialogs } from "@shared/api/telegramUser";
import { queryKeys } from "@shared/query/queryKeys";

export function useTelegramChats(accountId?: string) {
  return useQuery({
    queryKey: queryKeys.telegramUser.chats(accountId),
    queryFn: () => getUserDialogs({ accountId, limit: 1000 }),
    staleTime: 10 * 60 * 1000, // 10 минут - диалоги обновляются чаще
    refetchOnWindowFocus: false, // Не обновлять при фокусе окна
    enabled: !!accountId, // Запрос только при наличии accountId
  });
}
