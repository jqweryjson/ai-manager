import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@shared/query/queryKeys";
import { vkUserGetSubscriptions } from "@shared/api/vkUser";

export function useVkUserSubscriptions(accountId?: string | null) {
  return useQuery({
    queryKey: queryKeys.vkUser.subscriptions(accountId || undefined),
    queryFn: () => {
      if (!accountId) throw new Error("accountId is required");
      return vkUserGetSubscriptions(accountId);
    },
    enabled: !!accountId,
    staleTime: 30 * 1000,
  });
}


