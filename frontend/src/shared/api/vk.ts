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
export async function vkMiniAppAuth(vkParams: string): Promise<VkAuthResponse> {
  const response = await apiClient.post<VkAuthResponse>("/vk/auth", {
    vkParams,
  });
  return response.data;
}

/**
 * Авторизация через VK ID (Web login).
 * Фронтенд сам делает `Auth.exchangeCode(...)` через `@vkid/sdk`, а на бэкенд отправляет access_token
 * для верификации и выпуска наших JWT.
 */
export async function vkidLogin(accessToken: string): Promise<VkAuthResponse> {
  const response = await apiClient.post<VkAuthResponse>("/vk/auth/vkid-login", {
    access_token: accessToken,
  });
  return response.data;
}
