export type TelegramIntegrationStatus =
  | "not_connected"
  | "connected"
  | "preparing";

export interface TelegramIntegrationCardProps {
  isExpanded?: boolean;
  onExpand?: () => void;
  onCollapse?: () => void;
}
