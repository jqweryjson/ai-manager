/**
 * Валидация vk-params от VK Mini App
 * @param vkParams - строка vk-params от window.VK или query параметров
 * @param appSecret - секрет приложения из VK_APP_SECRET
 * @returns true если подпись валидна
 */
export declare function validateVkParams(vkParams: string, appSecret: string): boolean;
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
export declare function parseVkParams(vkParams: string): VkUserData | null;
/**
 * Получение access_token из vk-params (если присутствует)
 * В VK Mini App токен может передаваться в разных форматах
 */
export declare function getAccessTokenFromVkParams(vkParams: string): string | null;
//# sourceMappingURL=vk-auth.d.ts.map