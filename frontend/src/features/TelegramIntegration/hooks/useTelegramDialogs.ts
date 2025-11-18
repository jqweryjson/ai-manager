import { useInfiniteQuery } from "@tanstack/react-query";
import { getDialogs, type DialogsResponse } from "@shared/api/telegramUser";
import { queryKeys } from "@shared/query/queryKeys";

export function useTelegramDialogs(accountId?: string) {
  return useInfiniteQuery<DialogsResponse, Error>({
    queryKey: queryKeys.telegramUser.dialogs(accountId),
    queryFn: ({ pageParam }) =>
      getDialogs({
        accountId,
        limit: 50,
        offsetDate: pageParam as string | undefined,
      }),
    initialPageParam: undefined,
    getNextPageParam: (lastPage: DialogsResponse) =>
      lastPage.has_more ? lastPage.next_offset_date : undefined,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
    enabled: !!accountId,
  });
}
