/**
 * VK ID API (server-side) helpers.
 *
 * Используем для верификации access_token, полученного на фронтенде через `@vkid/sdk`,
 * и получения профиля пользователя VK ID.
 */
/**
 * Получить профиль VK ID по access_token.
 *
 * Важно: VK ID API ожидает токен в body как x-www-form-urlencoded (как в официальной доке).
 */
export async function getVkIdUserInfo(params) {
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
    const json = (await res.json().catch(() => null));
    if (!res.ok || !json) {
        throw new Error(`VK ID user_info failed: HTTP ${res.status}`);
    }
    if ("error" in json) {
        throw new Error(`VK ID user_info error: ${json.error_description || json.error}`);
    }
    return json;
}
//# sourceMappingURL=vkid-api.js.map