import { getVkAccount, decryptVkAccount, updateNextAllowedAt, updateVkAccountStatus, } from "./vk-account-postgres.js";
import { sendMessage } from "./vk-api.js";
/**
 * Парсинг rate limit из ошибки VK API
 */
function parseRateLimit(error) {
    const errorMessage = error?.message || String(error);
    // VK API error_code 6 = Too many requests
    if (errorMessage.includes("error_code: 6") ||
        errorMessage.includes("Too many requests")) {
        // VK API обычно не возвращает точное время, используем стандартное значение
        return 1; // 1 секунда для rate limit (3 req/sec)
    }
    return null;
}
/**
 * Отправка сообщения в VK
 */
export async function sendVkMessage(accountId, userId, peerId, peerType, text) {
    const account = await getVkAccount(accountId, userId);
    if (!account) {
        throw new Error("VK account not found");
    }
    if (account.status !== "connected") {
        return {
            success: false,
            error: "Account is not connected",
        };
    }
    // Расшифровываем access_token
    const { access_token } = decryptVkAccount(account);
    try {
        // Преобразуем peerId в число (VK API использует числа)
        const peerIdNum = parseInt(peerId, 10);
        if (isNaN(peerIdNum)) {
            return {
                success: false,
                error: "Invalid peer_id format",
            };
        }
        // Отправляем сообщение через VK API
        await sendMessage(access_token, peerIdNum, text);
        // После успешной отправки ставим rate limit (1 секунда для 3 req/sec)
        await updateNextAllowedAt(accountId, peerId, 1);
        return {
            success: true,
        };
    }
    catch (error) {
        const rateLimitSeconds = parseRateLimit(error);
        if (rateLimitSeconds) {
            // Обновляем next_allowed_at для rate limiting
            await updateNextAllowedAt(accountId, peerId, rateLimitSeconds);
            return {
                success: false,
                rateLimitSeconds,
                error: "Rate limit exceeded",
            };
        }
        // Обработка invalid token
        if (error?.message?.includes("error_code: 5") ||
            error?.message?.includes("Invalid token")) {
            await updateVkAccountStatus(accountId, userId, "expired");
            return {
                success: false,
                error: "Invalid access token",
            };
        }
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}
//# sourceMappingURL=vk-send.js.map