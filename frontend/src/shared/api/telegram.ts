import { apiClient } from "./client";

export interface TelegramAuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    picture?: string;
  };
}

export async function telegramAuth(
  initData: string
): Promise<TelegramAuthResponse> {
  const response = await apiClient.post<TelegramAuthResponse>("/tg/auth", {
    initData,
  });
  return response.data;
}
