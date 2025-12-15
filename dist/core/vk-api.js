/**
 * VK API клиент для работы с VK API
 */
const VK_API_VERSION = "5.131";
const VK_API_BASE_URL = "https://api.vk.com/method";
/**
 * Создание клиента VK API
 */
export function createVkApiClient(accessToken) {
    return {
        /**
         * Выполнение запроса к VK API
         */
        async request(method, params) {
            const url = new URL(`${VK_API_BASE_URL}/${method}`);
            url.searchParams.append("access_token", accessToken);
            url.searchParams.append("v", VK_API_VERSION);
            Object.entries(params).forEach(([key, value]) => {
                url.searchParams.append(key, String(value));
            });
            const response = await fetch(url.toString());
            const data = await response.json();
            if (data.error) {
                throw new Error(`VK API Error ${data.error.error_code}: ${data.error.error_msg}`);
            }
            if (!data.response) {
                throw new Error("VK API: No response data");
            }
            return data.response;
        },
    };
}
/**
 * Получение Long Poll сервера
 */
export async function getLongPollServer(accessToken) {
    const client = createVkApiClient(accessToken);
    return client.request("messages.getLongPollServer", {
        need_pts: 0,
        lp_version: 3,
    });
}
/**
 * Выполнение Long Poll запроса
 */
export async function longPoll(server, key, ts, wait = 25) {
    const url = `https://${server}?act=a_check&key=${key}&ts=${ts}&wait=${wait}`;
    const response = await fetch(url);
    const data = await response.json();
    if (data.failed) {
        throw new Error(`Long Poll failed: ${data.failed}`);
    }
    return {
        ts: data.ts,
        updates: data.updates || [],
    };
}
/**
 * Отправка сообщения
 */
export async function sendMessage(accessToken, peerId, text, randomId) {
    const client = createVkApiClient(accessToken);
    const result = await client.request("messages.send", {
        peer_id: peerId,
        message: text,
        random_id: randomId || Math.floor(Math.random() * 2e9),
    });
    return result;
}
/**
 * Получение списка диалогов
 */
export async function getConversations(accessToken, offset = 0, count = 20) {
    const client = createVkApiClient(accessToken);
    return client.request("messages.getConversations", {
        offset,
        count,
    });
}
/**
 * Получение информации о пользователях
 */
export async function getUserInfo(accessToken, userIds) {
    const client = createVkApiClient(accessToken);
    return client.request("users.get", {
        user_ids: userIds.join(","),
        fields: "photo_200,photo_100",
    });
}
//# sourceMappingURL=vk-api.js.map