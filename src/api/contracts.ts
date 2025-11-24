/**
 * API Contracts - единый источник истины для типов API.
 * Файл предназначен как для backend, так и для frontend (через npm run sync:types).
 * Здесь нет зависимостей от Zod-схем, чтобы файл был самодостаточным.
 */

// ============= SHARED TYPES =============

export type PeerType = "user" | "chat" | "channel";

export type AccountStatus =
  | "pending_code"
  | "pending_2fa"
  | "connected"
  | "flood_wait";

// ============= REQUEST TYPES =============

export interface StartConnectionRequest {
  api_id: string;
  api_hash: string;
  phone: string;
}

export interface VerifyCodeRequest {
  account_id: string;
  code: string;
}

export interface Verify2FARequest {
  account_id: string;
  password: string;
}

export interface DisconnectRequest {
  account_id: string;
}

export interface SubscriptionItemInput {
  peer_id: string;
  peer_type: PeerType;
  title: string;
  enabled?: boolean;
  workspace_id?: string | null;
  role_id?: string | null;
  mention_only?: boolean;
}

export interface SaveSubscriptionsRequest {
  account_id: string;
  items: SubscriptionItemInput[];
}

// ============= RESPONSE TYPES =============

export interface StartConnectionResponse {
  account_id: string;
  phone_code_hash: string;
}

export interface VerifyResponse {
  success?: boolean;
  requires_2fa?: boolean;
  account_id?: string;
}

export interface TelegramAccount {
  id: string;
  phone: string | null;
  status: AccountStatus;
  flood_wait_until: string | null;
  created_at: string;
}

export interface StatusResponse {
  accounts: TelegramAccount[];
}

export interface DisconnectResponse {
  success: boolean;
}

export interface DialogItem {
  peer_id: string;
  peer_type: PeerType;
  title: string;
  unread_count: number;
}

export interface DialogsResponse {
  account_id: string;
  dialogs: DialogItem[];
  has_more: boolean;
  next_offset_date?: string;
}

export interface ContactsResponse {
  account_id: string;
  dialogs: DialogItem[];
}

export interface AllDialogsResponse {
  account_id: string;
  dialogs: DialogItem[];
}

export interface SubscriptionItem {
  peer_id: string;
  peer_type: PeerType;
  title: string;
  enabled: boolean;
  workspace_id: string | null;
  role_id: string | null;
  mention_only: boolean;
}

export interface GetSubscriptionsResponse {
  subscriptions: SubscriptionItem[];
}

export interface SaveSubscriptionsResponse {
  success: boolean;
  subscriptions: Array<
    SubscriptionItem & {
      id: string;
      telegram_account_id: string;
      created_at: string;
      updated_at: string;
    }
  >;
}

// ============= HELPER TYPES =============

/**
 * Полный тип подписки с метаданными БД (используется в SaveSubscriptionsResponse)
 */
export type SubscriptionFull =
  SaveSubscriptionsResponse["subscriptions"][number];

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
