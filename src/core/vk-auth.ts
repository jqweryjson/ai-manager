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

    // Удаляем sign из параметров для проверки
    urlParams.delete("sign");

    // Сортируем параметры по ключу
    const dataCheckString = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join("&");

    // Вычисляем MD5 хэш от dataCheckString + appSecret
    const calculatedSign = crypto
      .createHash("md5")
      .update(dataCheckString + appSecret)
      .digest("hex");

    // Сравниваем подписи
    return calculatedSign === sign;
  } catch (error) {
    return false;
  }
}

/**
 * Парсинг vk-params и извлечение данных пользователя
 */
export interface VkUserData {
  id: number;
  first_name: string;
  last_name?: string;
  photo?: string;
  photo_rec?: string;
  hash?: string;
}

export function parseVkParams(vkParams: string): VkUserData | null {
  try {
    const urlParams = new URLSearchParams(vkParams);
    const vkUserId = urlParams.get("vk_user_id");
    const vkAppId = urlParams.get("vk_app_id");
    const vkIsAppUser = urlParams.get("vk_is_app_user");
    const vkAreNotificationsEnabled = urlParams.get(
      "vk_are_notifications_enabled"
    );
    const vkLanguage = urlParams.get("vk_language");
    const vkRef = urlParams.get("vk_ref");
    const vkAccessTokenSettings = urlParams.get("vk_access_token_settings");
    const vkViewerGroupRole = urlParams.get("vk_viewer_group_role");
    const vkPlatform = urlParams.get("vk_platform");
    const vkIsFavorite = urlParams.get("vk_is_favorite");
    const sign = urlParams.get("sign");

    if (!vkUserId) {
      return null;
    }

    // В vk-params может быть access_token, но для получения данных пользователя
    // нужно использовать VK API с этим токеном
    return {
      id: parseInt(vkUserId, 10),
      first_name: "", // Будет получено через VK API
      last_name: "",
      photo: "",
      photo_rec: "",
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
