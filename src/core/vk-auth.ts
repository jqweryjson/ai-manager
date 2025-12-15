import crypto from "crypto";

/**
 * Валидация vk-params от VK Mini App
 * @param vkParams - строка vk-params от window.VK или query параметров
 * @param appSecret - секрет приложения из VK_APP_SECRET
 * @returns true если подпись валидна
 */
export function validateVkParams(vkParams: string, appSecret: string): boolean {
  try {
    const urlParams = new URLSearchParams(vkParams);
    const sign = urlParams.get("sign");

    if (!sign) {
      return false;
    }

    // VK Mini Apps: подписываются параметры vk_* (без sign),
    // строка собирается как key=value&..., ключи сортируются по алфавиту.
    const dataCheckString = Array.from(urlParams.entries())
      .filter(([key]) => key !== "sign" && key.startsWith("vk_"))
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join("&");

    const hmac = crypto
      .createHmac("sha256", appSecret)
      .update(dataCheckString)
      .digest("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/g, "");

    if (hmac === sign) {
      return true;
    }

    // Backward-compat: старый алгоритм (MD5), если где-то был закеширован/использован.
    // Можно будет удалить позже после подтверждения, что везде HMAC.
    const legacyMd5 = crypto
      .createHash("md5")
      .update(dataCheckString + appSecret)
      .digest("hex");

    return legacyMd5 === sign;
  } catch (error) {
    return false;
  }
}

/**
 * Парсинг vk-params и извлечение данных пользователя
 */
export interface VkUserData {
  id: number;
  first_name?: string;
  last_name?: string;
  photo?: string;
  photo_rec?: string;
  hash?: string;
}

export function parseVkParams(vkParams: string): VkUserData | null {
  try {
    const urlParams = new URLSearchParams(vkParams);
    const vkUserId = urlParams.get("vk_user_id");

    if (!vkUserId) {
      return null;
    }

    return {
      id: parseInt(vkUserId, 10),
    };
  } catch (error) {
    return null;
  }
}

/**
 * Получение access_token из vk-params (если присутствует)
 * В VK Mini App токен может передаваться в разных форматах
 */
export function getAccessTokenFromVkParams(vkParams: string): string | null {
  try {
    const urlParams = new URLSearchParams(vkParams);
    // Пробуем разные варианты параметров
    return (
      urlParams.get("access_token") ||
      urlParams.get("vk_access_token") ||
      urlParams.get("token") ||
      null
    );
  } catch (error) {
    return null;
  }
}
