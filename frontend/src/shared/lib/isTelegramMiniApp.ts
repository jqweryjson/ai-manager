type TelegramWebAppGlobal = {
  Telegram?: {
    WebApp?: {
      initData?: string;
      ready?: () => void;
      expand?: () => void;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
};

/**
 * Проверяет, запущено ли приложение внутри Telegram Mini App.
 * Проверяет наличие ключевых свойств WebApp API, которые есть только в настоящем Mini App.
 */
export function isTelegramMiniApp(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const global = window as unknown as TelegramWebAppGlobal;
  const tg = global.Telegram;

  if (!tg || typeof tg !== "object") {
    return false;
  }

  const webApp = tg.WebApp;
  if (!webApp || typeof webApp !== "object") {
    return false;
  }

  // Проверяем наличие ключевых свойств, которые есть только в настоящем Mini App:
  // - initData (строка с данными авторизации)
  // - ready (метод инициализации)
  // - expand (метод расширения окна)
  const hasInitData =
    typeof webApp.initData === "string" && webApp.initData.length > 0;
  const hasReady = typeof webApp.ready === "function";
  const hasExpand = typeof webApp.expand === "function";

  // Только если все ключевые свойства присутствуют - это настоящий Mini App
  return hasInitData && hasReady && hasExpand;
}
