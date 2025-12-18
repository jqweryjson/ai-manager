export const queryKeys = {
  user: {
    me: ["user", "me"] as const,
  },
  documents: (workspaceId?: string) =>
    ["documents", workspaceId || "all"] as const,
  chat: ["chat"] as const,
  roles: () => ["roles"] as const,
  telegramUser: {
    status: ["telegram-user", "status"] as const,
    dialogs: (accountId?: string) =>
      ["telegram-user", "dialogs", accountId || "default"] as const,
    contacts: (accountId?: string) =>
      ["telegram-user", "contacts", accountId || "default"] as const,
    chats: (accountId?: string) =>
      ["telegram-user", "chats", accountId || "default"] as const,
    subscriptions: (accountId?: string) =>
      ["telegram-user", "subscriptions", accountId || "default"] as const,
  },
  vkUser: {
    status: ["vk-user", "status"] as const,
    conversations: (accountId?: string) =>
      ["vk-user", "conversations", accountId || "default"] as const,
    subscriptions: (accountId?: string) =>
      ["vk-user", "subscriptions", accountId || "default"] as const,
  },
};
