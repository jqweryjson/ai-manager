import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@shared/query/queryKeys";
import { vkUserGetStatus } from "@shared/api/vkUser";
import type { BadgeProps } from "@consta/uikit/Badge";

export type VkAccountStatus = "not_connected" | "pending_auth" | "connected" | "expired";

export type IntegrationStatusLabel = {
  label: string;
  status: BadgeProps["status"];
};

export function useVkUserStatus() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.vkUser.status,
    queryFn: vkUserGetStatus,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });

  const accounts = data?.accounts || [];
  const connected = accounts.find(a => a.status === "connected") || null;
  const first = accounts[0] || null;

  let status: VkAccountStatus = "not_connected";
  let accountId: string | null = null;
  let vkUserId: number | null = null;

  if (connected) {
    status = "connected";
    accountId = connected.id;
    vkUserId = connected.user_id_vk ?? null;
  } else if (first) {
    status = first.status;
    accountId = first.id;
    vkUserId = first.user_id_vk ?? null;
  }

  return {
    status,
    accountId,
    vkUserId,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}


