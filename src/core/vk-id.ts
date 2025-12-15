/**
 * VK ID авторизация (современный подход)
 * Использует id.vk.com вместо oauth.vk.com
 */

import { randomUUID } from "crypto";

const VK_ID_BASE_URL = "https://id.vk.com";
const VK_LOGIN_BASE_URL = "https://login.vk.com";

export interface VkIdInitResponse {
  uuid: string;
  authUrl: string;
}

export interface VkIdTokenResponse {
  access_token: string;
  silent_token: string;
  user_id: number;
  expires_in?: number;
}

/**
 * Генерация UUID и URL для инициации VK ID авторизации
 * 
 * ПРИМЕЧАНИЕ: VK ID может требовать использования SDK на фронтенде (@vkid/sdk).
 * Если прямой редирект не работает, возможно нужно использовать SDK.
 * 
 * Попробуем несколько вариантов URL:
 * 1. https://id.vk.com/auth
 * 2. https://id.vk.com/oauth
 * 3. https://oauth.vk.com/authorize (классический OAuth)
 */
export function initVkIdAuth(
  appId: string,
  redirectUri: string,
  scope: string = "email",
  state?: string
): VkIdInitResponse {
  const uuid = randomUUID();

  // Пробуем использовать id.vk.com/oauth (без /authorize)
  const params = new URLSearchParams({
    uuid,
    redirect_uri: redirectUri,
    app_id: appId,
    response_type: "token", // silent token
    scope,
  });

  // Добавляем state (UUID) в параметры
  const stateValue = state || uuid;
  params.append("state", stateValue);

  // Пробуем id.vk.com/oauth (без /authorize)
  const authUrl = `${VK_ID_BASE_URL}/oauth?${params.toString()}`;

  return {
    uuid: stateValue,
    authUrl,
  };
}

/**
 * Обмен code на access token через VK ID API
 * Используется когда фронтенд получает code от VK ID SDK
 */
export async function exchangeCodeForToken(
  appId: string,
  appSecret: string,
  code: string,
  deviceId: string
): Promise<{
  access_token: string;
  user_id: number;
  expires_in?: number;
}> {
  // VK ID использует специальный endpoint для обмена code на токен
  // Попробуем использовать login.vk.com/token с параметрами code
  const response = await fetch(`${VK_LOGIN_BASE_URL}/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code,
      device_id: deviceId,
      app_id: appId,
      client_secret: appSecret,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      `VK ID Error: ${error.error_description || error.error || "Unknown error"}`
    );
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(
      `VK ID Error: ${data.error_description || data.error}`
    );
  }

  return {
    access_token: data.access_token,
    user_id: data.user_id,
    expires_in: data.expires_in,
  };
}

/**
 * Обмен silent token на access token через login.vk.com
 * Это нужно для получения access_token для работы с VK API
 * @deprecated Используйте exchangeCodeForToken для работы с VK ID SDK
 */
export async function exchangeSilentToken(
  appId: string,
  silentToken: string,
  uuid: string
): Promise<VkIdTokenResponse> {
  const response = await fetch(`${VK_LOGIN_BASE_URL}/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      token: silentToken,
      uuid,
      app_id: appId,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      `VK ID Error: ${error.error_description || error.error || "Unknown error"}`
    );
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(
      `VK ID Error: ${data.error_description || data.error}`
    );
  }

  return {
    access_token: data.access_token,
    silent_token: silentToken,
    user_id: data.user_id,
    expires_in: data.expires_in,
  };
}


