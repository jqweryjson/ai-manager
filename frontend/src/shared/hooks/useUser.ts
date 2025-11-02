import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/query/queryKeys";
import { getCurrentUser, logout } from "@/entities/User";

export function useCurrentUserQuery() {
  const hasToken =
    typeof window !== "undefined" && !!localStorage.getItem("access_token");

  return useQuery({
    queryKey: queryKeys.user.me,
    queryFn: () => getCurrentUser(),
    enabled: hasToken,
    retry: 1,
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => logout(),
    onSuccess: () => {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      queryClient.invalidateQueries();
    },
  });
}
