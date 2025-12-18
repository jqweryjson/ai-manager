import type { IntegrationStatusLabel, VkAccountStatus } from "../hooks/useVkUserStatus";

export function isConnected(status: VkAccountStatus): boolean {
  return status === "connected";
}

export function isPreparing(status: VkAccountStatus): boolean {
  return status === "pending_auth";
}

export function getStatusLabel(status: VkAccountStatus): IntegrationStatusLabel {
  if (status === "connected") {
    return { label: "подключено", status: "success" };
  }
  if (status === "pending_auth") {
    return { label: "подключение", status: "system" };
  }
  if (status === "expired") {
    return { label: "истекло", status: "warning" };
  }
  return { label: "не подключено", status: "error" };
}


