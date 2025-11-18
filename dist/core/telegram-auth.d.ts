/**
 * Валидация initData от Telegram WebApp
 * @param initData - строка initData от window.Telegram.WebApp.initData
 * @param botToken - токен бота из TELEGRAM_BOT_TOKEN
 * @returns true если подпись валидна
 */
export declare function validateTelegramInitData(initData: string, botToken: string): boolean;
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
export declare function parseTelegramInitData(initData: string): TelegramUserData | null;
//# sourceMappingURL=telegram-auth.d.ts.map