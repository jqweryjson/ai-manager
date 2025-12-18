export const peerTypeMeta: Record<
  "user" | "chat" | "group",
  { emoji: string; label: string }
> = {
  user: { emoji: "👤", label: "Личные сообщения" },
  chat: { emoji: "💬", label: "Чат" },
  group: { emoji: "👥", label: "Сообщество" },
};


