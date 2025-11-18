import type { TelegramAccountStatus } from "../hooks/useTelegramUserStatus";

/**
 * Определяет, подключен ли аккаунт
 */
export function isConnected(status: TelegramAccountStatus): boolean {
  return status === "connected";
}

/**
 * Определяет, идет ли процесс подготовки/подключения
 */
export function isPreparing(status: TelegramAccountStatus): boolean {
  return status === "preparing" || status === "pending_code";
}

/**
 * Получает текстовую метку статуса
 */
export function getStatusLabel(status: TelegramAccountStatus): string {
  if (isPreparing(status)) {
    return "подготовка";
  }
  if (isConnected(status)) {
    return "подключено";
  }
  return "не подключено";
}
