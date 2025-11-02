import { apiClient } from "@/shared/api/client";

export async function refreshAccessToken(
  refreshToken: string
): Promise<string> {
  const { data } = await apiClient.post<{ accessToken: string }>(
    "/auth/refresh",
    { refreshToken }
  );
  return data.accessToken;
}
