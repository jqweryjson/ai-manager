import crypto from "crypto";

/**
 * Валидация initData от Telegram WebApp
 * @param initData - строка initData от window.Telegram.WebApp.initData
 * @param botToken - токен бота из TELEGRAM_BOT_TOKEN
 * @returns true если подпись валидна
 */
export function validateTelegramInitData(
  initData: string,
  botToken: string
): boolean {
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
  } catch (error) {
    return false;
  }
}

/**
 * Парсинг initData и извлечение данных пользователя
 */
export interface TelegramUserData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  language_code?: string;
}

export function parseTelegramInitData(
  initData: string
): TelegramUserData | null {
  try {
    const urlParams = new URLSearchParams(initData);
    const userParam = urlParams.get("user");

    if (!userParam) {
      return null;
    }

    const user = JSON.parse(userParam) as TelegramUserData;
    return user;
  } catch (error) {
    return null;
  }
}
