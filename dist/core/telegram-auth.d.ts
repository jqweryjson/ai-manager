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
export declare function validateTelegramLoginWidget(data: TelegramLoginWidgetData, botToken: string): boolean;
//# sourceMappingURL=telegram-auth.d.ts.map