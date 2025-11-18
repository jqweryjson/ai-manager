/**
 * API Contracts - единый источник истины для типов API
 * 
 * Этот файл генерируется из Zod схем и используется на фронтенде.
 * Для синхронизации типов на фронтенд используйте:
 * npm run sync:types
 */

import { z } from "zod";
import {
  // Shared
  PeerTypeSchema,
  AccountStatusSchema,
  
  // Request schemas
  StartConnectionSchema,
  VerifyCodeSchema,
  Verify2FASchema,
  DisconnectSchema,
  SubscriptionItemInputSchema,
  SaveSubscriptionsRequestSchema,
  
  // Response schemas
  StartConnectionResponseSchema,
  VerifyResponseSchema,
  TelegramAccountSchema,
  StatusResponseSchema,
  DisconnectResponseSchema,
  DialogItemSchema,
  DialogsResponseSchema,
  ContactsResponseSchema,
  AllDialogsResponseSchema,
  SubscriptionItemSchema,
  GetSubscriptionsResponseSchema,
  SaveSubscriptionsResponseSchema,
} from "./telegram-user/schemas.js";

// ============= SHARED TYPES =============

export type PeerType = z.infer<typeof PeerTypeSchema>;
export type AccountStatus = z.infer<typeof AccountStatusSchema>;

// ============= REQUEST TYPES =============

export type StartConnectionRequest = z.input<typeof StartConnectionSchema>;
export type VerifyCodeRequest = z.input<typeof VerifyCodeSchema>;
export type Verify2FARequest = z.input<typeof Verify2FASchema>;
export type DisconnectRequest = z.input<typeof DisconnectSchema>;

export type SubscriptionItemInput = z.infer<typeof SubscriptionItemInputSchema>;
export type SaveSubscriptionsRequest = z.infer<typeof SaveSubscriptionsRequestSchema>;

// ============= RESPONSE TYPES =============

export type StartConnectionResponse = z.infer<typeof StartConnectionResponseSchema>;
export type VerifyResponse = z.infer<typeof VerifyResponseSchema>;
export type TelegramAccount = z.infer<typeof TelegramAccountSchema>;
export type StatusResponse = z.infer<typeof StatusResponseSchema>;
export type DisconnectResponse = z.infer<typeof DisconnectResponseSchema>;

export type DialogItem = z.infer<typeof DialogItemSchema>;
export type DialogsResponse = z.infer<typeof DialogsResponseSchema>;
export type ContactsResponse = z.infer<typeof ContactsResponseSchema>;
export type AllDialogsResponse = z.infer<typeof AllDialogsResponseSchema>;

export type SubscriptionItem = z.infer<typeof SubscriptionItemSchema>;
export type GetSubscriptionsResponse = z.infer<typeof GetSubscriptionsResponseSchema>;
export type SaveSubscriptionsResponse = z.infer<typeof SaveSubscriptionsResponseSchema>;

// ============= HELPER TYPES =============

/**
 * Полный тип подписки с метаданными БД (используется в SaveSubscriptionsResponse)
 */
export type SubscriptionFull = SaveSubscriptionsResponse["subscriptions"][number];

/**
 * Query параметры для пагинации диалогов
 */
export interface DialogsPageParams {
  accountId?: string;
  limit?: number;
  offsetDate?: string;
}

/**
 * Query параметры для получения контактов
 */
export interface GetContactsParams {
  accountId?: string;
}

/**
 * Query параметры для получения всех диалогов
 */
export interface GetAllDialogsParams {
  accountId?: string;
  limit?: number;
}

