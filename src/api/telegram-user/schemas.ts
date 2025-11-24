import { z } from "zod";

// ============= SHARED SCHEMAS =============

export const PeerTypeSchema = z.enum(["user", "chat", "channel"]);

export const AccountStatusSchema = z.enum([
  "pending_code",
  "pending_2fa",
  "connected",
  "flood_wait",
]);

// ============= REQUEST SCHEMAS =============

export const StartConnectionSchema = z.object({
  api_id: z
    .string()
    .transform(val => val.trim())
    .pipe(
      z.string().refine(
        val => {
          const num = parseInt(val, 10);
          return !isNaN(num) && num > 0;
        },
        { message: "API ID должен быть положительным числом" }
      )
    )
    .transform(val => parseInt(val, 10)),
  api_hash: z
    .string()
    .min(1)
    .transform(val => val.trim()),
  phone: z
    .string()
    .min(1)
    .transform(val => val.trim()),
});

export const VerifyCodeSchema = z.object({
  account_id: z
    .string()
    .min(1)
    .transform(val => val.trim()),
  code: z
    .string()
    .min(1)
    .transform(val => val.trim()),
});

export const Verify2FASchema = z.object({
  account_id: z
    .string()
    .min(1)
    .transform(val => val.trim()),
  password: z
    .string()
    .min(1)
    .transform(val => val.trim()),
});

export const DisconnectSchema = z.object({
  account_id: z
    .string()
    .min(1)
    .transform(val => val.trim()),
});

export const SubscriptionItemInputSchema = z
  .object({
    peer_id: z.string().min(1),
    peer_type: PeerTypeSchema,
    title: z.string().min(1),
    enabled: z.boolean().optional(),
    workspace_id: z.string().nullable().optional(),
    role_id: z.string().nullable().optional(),
    mention_only: z.boolean().optional(),
  })
  .refine(
    data => {
      // Бизнес-правило: если enabled=true, то workspace_id и role_id обязательны
      if (data.enabled && (!data.workspace_id || !data.role_id)) {
        return false;
      }
      return true;
    },
    {
      message: "workspace_id и role_id обязательны когда enabled=true",
    }
  );

export const SaveSubscriptionsRequestSchema = z.object({
  account_id: z.string().min(1),
  items: z.array(SubscriptionItemInputSchema).min(1),
});

// ============= RESPONSE SCHEMAS =============

export const StartConnectionResponseSchema = z.object({
  account_id: z.string(),
  phone_code_hash: z.string(),
});

export const VerifyResponseSchema = z.object({
  success: z.boolean().optional(),
  requires_2fa: z.boolean().optional(),
  account_id: z.string().optional(),
});

export const TelegramAccountSchema = z.object({
  id: z.string(),
  phone: z.string().nullable(),
  status: AccountStatusSchema,
  flood_wait_until: z.string().nullable(),
  created_at: z.string(),
});

export const StatusResponseSchema = z.object({
  accounts: z.array(TelegramAccountSchema),
});

export const DisconnectResponseSchema = z.object({
  success: z.boolean(),
});

export const DialogItemSchema = z.object({
  peer_id: z.string(),
  peer_type: PeerTypeSchema,
  title: z.string(),
  unread_count: z.number(),
});

export const DialogsResponseSchema = z.object({
  account_id: z.string(),
  dialogs: z.array(DialogItemSchema),
  has_more: z.boolean(),
  next_offset_date: z.string().optional(),
});

export const ContactsResponseSchema = z.object({
  account_id: z.string(),
  dialogs: z.array(DialogItemSchema),
});

export const AllDialogsResponseSchema = z.object({
  account_id: z.string(),
  dialogs: z.array(DialogItemSchema),
});

export const SubscriptionItemSchema = z.object({
  peer_id: z.string(),
  peer_type: PeerTypeSchema,
  title: z.string(),
  enabled: z.boolean(),
  workspace_id: z.string().nullable(),
  role_id: z.string().nullable(),
  mention_only: z.boolean(),
});

export const GetSubscriptionsResponseSchema = z.object({
  subscriptions: z.array(SubscriptionItemSchema),
});

export const SaveSubscriptionsResponseSchema = z.object({
  success: z.boolean(),
  subscriptions: z.array(
    SubscriptionItemSchema.extend({
      id: z.string(),
      telegram_account_id: z.string(),
      created_at: z.string(),
      updated_at: z.string(),
    })
  ),
});
