export type TelegramIntegrationStatus =
  | "not_connected"
  | "connected"
  | "preparing";

export interface TelegramIntegrationCardProps {
  isExpanded: boolean;
  onExpand: (isExpanded: boolean) => void;
}
