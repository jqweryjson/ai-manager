/**
 * VK ID API (server-side) helpers.
 *
 * Используем для верификации access_token, полученного на фронтенде через `@vkid/sdk`,
 * и получения профиля пользователя VK ID.
 */

export type VkIdUserInfo = {
  user: {
    user_id: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    email?: string;
    avatar?: string;
    sex?: number;
    verified?: boolean;
    birthday?: string;
  };
};

type VkIdError = {
  error: string;
  error_description?: string;
  state?: string;
};

/**
 * Получить профиль VK ID по access_token.
 *
 * Важно: VK ID API ожидает токен в body как x-www-form-urlencoded (как в официальной доке).
 */
export async function getVkIdUserInfo(params: {
  appId: string;
  accessToken: string;
}): Promise<VkIdUserInfo> {
  const { appId, accessToken } = params;

  const url = new URL("https://id.vk.ru/oauth2/user_info");
  url.searchParams.set("client_id", appId);

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      access_token: accessToken,
    }),
  });

  const json = (await res.json().catch(() => null)) as
    | VkIdUserInfo
    | VkIdError
    | null;

  if (!res.ok || !json) {
    throw new Error(`VK ID user_info failed: HTTP ${res.status}`);
  }

  if ("error" in json) {
    throw new Error(
      `VK ID user_info error: ${json.error_description || json.error}`
    );
  }

  return json;
}
