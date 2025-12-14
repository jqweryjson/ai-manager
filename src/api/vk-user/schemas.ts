import { z } from "zod";

/**
 * Схема для начала OAuth авторизации
 */
export const StartConnectionSchema = z.object({
  // Для VK не нужны api_id/api_hash, только OAuth redirect
});

/**
 * Схема для OAuth callback
 */
export const OAuthCallbackSchema = z.object({
  code: z.string().min(1),
  state: z.string().optional(), // Для проверки CSRF (опционально)
});

/**
 * Схема для сохранения подписок
 */
export const SaveSubscriptionsSchema = z.object({
  account_id: z.string().min(1),
  items: z.array(
    z.object({
      peer_id: z.string().min(1),
      peer_type: z.enum(["user", "chat", "group"]),
      title: z.string().min(1),
      enabled: z.boolean(),
      workspace_id: z.string().nullable().optional(),
      role_id: z.string().nullable().optional(),
      mention_only: z.boolean().nullable().optional(),
    })
  ),
});

/**
 * Схема для отправки сообщения
 */
export const SendMessageSchema = z.object({
  account_id: z.string().min(1),
  peer_id: z.string().min(1),
  peer_type: z.enum(["user", "chat", "group"]),
  text: z.string().min(1),
});
