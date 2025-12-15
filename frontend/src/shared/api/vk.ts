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
export async function vkAuth(vkParams: string): Promise<VkAuthResponse> {
  const response = await apiClient.post<VkAuthResponse>("/vk/auth", {
    vkParams,
  });
  return response.data;
}

/**
 * Авторизация через VK ID (code от SDK)
 * @param code - код авторизации от VK ID SDK
 * @param deviceId - device ID от VK ID SDK
 */
export async function vkIdAuth(
  code: string,
  deviceId: string
): Promise<VkAuthResponse> {
  const response = await apiClient.post<VkAuthResponse>("/vk/auth/code", {
    code,
    device_id: deviceId,
  });
  return response.data;
}
