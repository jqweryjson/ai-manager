import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@shared/query/queryKeys";
import { vkUserGetConversations } from "@shared/api/vkUser";

export function useVkUserConversations(accountId?: string | null) {
  return useQuery({
    queryKey: queryKeys.vkUser.conversations(accountId || undefined),
    queryFn: () => {
      if (!accountId) throw new Error("accountId is required");
      // MVP: забираем одним запросом 200 диалогов
      return vkUserGetConversations({ accountId, offset: 0, count: 200 });
    },
    enabled: !!accountId,
    staleTime: 30 * 1000,
  });
}


