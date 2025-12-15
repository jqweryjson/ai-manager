import crypto from "crypto";
/**
 * Валидация initData от Telegram WebApp
 * @param initData - строка initData от window.Telegram.WebApp.initData
 * @param botToken - токен бота из TELEGRAM_BOT_TOKEN
 * @returns true если подпись валидна
 */
export function validateTelegramInitData(initData, botToken) {
    try {
        const urlParams = new URLSearchParams(initData);
        const hash = urlParams.get("hash");
        if (!hash) {
            return false;
        }
        // Удаляем hash из параметров для проверки
        urlParams.delete("hash");
        // Сортируем параметры по ключу
        const dataCheckString = Array.from(urlParams.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, value]) => `${key}=${value}`)
            .join("\n");
        // Создаём секретный ключ из botToken
        const secretKey = crypto
            .createHmac("sha256", "WebAppData")
            .update(botToken)
            .digest();
        // Вычисляем HMAC
        const calculatedHash = crypto
            .createHmac("sha256", secretKey)
            .update(dataCheckString)
            .digest("hex");
        // Сравниваем хеши
        return calculatedHash === hash;
    }
    catch (error) {
        return false;
    }
}
export function parseTelegramInitData(initData) {
    try {
        const urlParams = new URLSearchParams(initData);
        const userParam = urlParams.get("user");
        if (!userParam) {
            return null;
        }
        const user = JSON.parse(userParam);
        return user;
    }
    catch (error) {
        return null;
    }
}
/**
 * Валидация данных от Telegram Login Widget
 * @param data - данные пользователя от виджета
 * @param botToken - токен бота из TELEGRAM_BOT_TOKEN
 * @returns true если подпись валидна
 */
export function validateTelegramLoginWidget(data, botToken) {
    try {
        // Создаём data-check-string из всех полей кроме hash
        const { hash, ...dataWithoutHash } = data;
        const dataCheckString = Object.entries(dataWithoutHash)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, value]) => `${key}=${value}`)
            .join("\n");
        // Вычисляем SHA256 хэш токена бота
        const secretKey = crypto.createHash("sha256").update(botToken).digest();
        // Вычисляем HMAC-SHA256
        const calculatedHash = crypto
            .createHmac("sha256", secretKey)
            .update(dataCheckString)
            .digest("hex");
        // Сравниваем хеши
        return calculatedHash === hash;
    }
    catch (error) {
        return false;
    }
}
//# sourceMappingURL=telegram-auth.js.map