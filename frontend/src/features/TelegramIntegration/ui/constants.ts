import type { DialogItem } from "@shared/api/telegramUser";

export const peerTypeMeta: Record<
  DialogItem["peer_type"],
  { emoji: string; label: string }
> = {
  user: { emoji: "👤", label: "Личные" },
  chat: { emoji: "👥", label: "Группы" },
  channel: { emoji: "📣", label: "Каналы" },
};
