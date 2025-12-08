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

/**
 * Данные пользователя от Telegram Login Widget
 */
export interface TelegramLoginWidgetData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

/**
 * Валидация данных от Telegram Login Widget
 * @param data - данные пользователя от виджета
 * @param botToken - токен бота из TELEGRAM_BOT_TOKEN
 * @returns true если подпись валидна
 */
export function validateTelegramLoginWidget(
  data: TelegramLoginWidgetData,
  botToken: string
): boolean {
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
  } catch (error) {
    return false;
  }
}
