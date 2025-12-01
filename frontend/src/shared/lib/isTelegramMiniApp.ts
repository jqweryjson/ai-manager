type TelegramWebAppGlobal = {
  Telegram?: {
    WebApp?: unknown;
    [key: string]: unknown;
  };
};

export function isTelegramMiniApp(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const global = window as unknown as TelegramWebAppGlobal;
  const tg = global.Telegram;

  if (!tg || typeof tg !== "object") {
    return false;
  }

  return !!tg.WebApp;
}
