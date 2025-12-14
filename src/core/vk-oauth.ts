/**
 * VK OAuth авторизация
 */

const VK_OAUTH_BASE_URL = "https://oauth.vk.com";

export interface VkOAuthTokenResponse {
  access_token: string;
  expires_in: number;
  user_id: number;
  refresh_token?: string;
}

/**
 * Генерация URL для OAuth авторизации
 */
export function getOAuthUrl(
  appId: string,
  redirectUri: string,
  scope: string = "messages,offline",
  state?: string
): string {
  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    display: "page",
    scope,
    response_type: "code",
    v: "5.131",
  });

  if (state) {
    params.append("state", state);
  }

  return `${VK_OAUTH_BASE_URL}/authorize?${params.toString()}`;
}

/**
 * Обмен code на access_token
 */
export async function exchangeCodeForToken(
  appId: string,
  appSecret: string,
  code: string,
  redirectUri: string
): Promise<VkOAuthTokenResponse> {
  const params = new URLSearchParams({
    client_id: appId,
    client_secret: appSecret,
    redirect_uri: redirectUri,
    code,
  });

  const response = await fetch(
    `${VK_OAUTH_BASE_URL}/access_token?${params.toString()}`
  );
  const data = await response.json();

  if (data.error) {
    throw new Error(`VK OAuth Error: ${data.error_description || data.error}`);
  }

  return {
    access_token: data.access_token,
    expires_in: data.expires_in || 0,
    user_id: data.user_id,
    refresh_token: data.refresh_token,
  };
}

/**
 * Обновление access_token через refresh_token
 */
export async function refreshAccessToken(
  appId: string,
  appSecret: string,
  refreshToken: string
): Promise<VkOAuthTokenResponse> {
  // VK API не поддерживает refresh_token в стандартном OAuth 2.0 смысле
  // Токены обычно долгоживущие (несколько месяцев)
  // Если токен истек, нужно переавторизоваться через OAuth
  throw new Error(
    "VK API does not support refresh_token. Re-authorization required."
  );
}

/**
 * Проверка валидности токена
 */
export async function validateToken(accessToken: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://api.vk.com/method/users.get?access_token=${accessToken}&v=5.131`
    );
    const data = await response.json();

    return !data.error;
  } catch (error) {
    return false;
  }
}
