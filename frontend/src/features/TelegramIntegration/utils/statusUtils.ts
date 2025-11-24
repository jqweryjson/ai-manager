import type {
  IntegrationStatusLabel,
  TelegramAccountStatus,
} from "../hooks/useTelegramUserStatus";

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
export function getStatusLabel(
  status: TelegramAccountStatus
): IntegrationStatusLabel {
  if (isPreparing(status)) {
    return { label: "подготовка", status: "system" };
  }
  if (isConnected(status)) {
    return { label: "подключено", status: "success" };
  }
  return { label: "не подключено", status: "error" };
}
