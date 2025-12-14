import { apiClient } from "./client";

export interface VkAuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    picture?: string;
  };
}

/**
 * Авторизация через VK Mini App
 * @param vkParams - параметры из VK Mini App (vk-params)
 */
export async function vkAuth(
  vkParams: string
): Promise<VkAuthResponse> {
  const response = await apiClient.post<VkAuthResponse>("/vk/auth", {
    vkParams,
  });
  return response.data;
}

/**
 * Авторизация через VK OAuth (Standalone/Сайт режим)
 * @param code - код авторизации из OAuth callback
 */
export async function vkOAuthAuth(
  code: string
): Promise<VkAuthResponse> {
  const response = await apiClient.post<VkAuthResponse>("/vk/auth/oauth", {
    code,
  });
  return response.data;
}

