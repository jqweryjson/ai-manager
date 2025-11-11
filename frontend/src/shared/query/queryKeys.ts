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
  },
};
