import { API_BASE_URL } from "@shared/config/api";

function authHeaders(): HeadersInit {
  return {
    Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
  };
}

function authJsonHeaders(): HeadersInit {
  return {
    ...authHeaders(),
    "Content-Type": "application/json",
  };
}

export type VkUserAccountStatus = "pending_auth" | "connected" | "expired";

export type VkUserAccount = {
  id: string;
  user_id_vk: number | null;
  status: VkUserAccountStatus;
  expires_at: string | null;
  created_at: string;
};

export type VkUserStatusResponse = {
  accounts: VkUserAccount[];
};

export async function vkUserStartConnection(): Promise<{ oauth_url: string }> {
  const res = await fetch(`${API_BASE_URL}/vk-user/start`, {
    method: "POST",
    headers: authJsonHeaders(),
    body: JSON.stringify({}),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function vkUserGetStatus(): Promise<VkUserStatusResponse> {
  const res = await fetch(`${API_BASE_URL}/vk-user/status`, {
    method: "GET",
    headers: authHeaders(),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function vkUserDisconnect(accountId: string): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE_URL}/vk-user/disconnect`, {
    method: "POST",
    headers: authJsonHeaders(),
    body: JSON.stringify({ account_id: accountId }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export type VkDialogItem = {
  peer_id: string;
  peer_type: "user" | "chat" | "group";
  title: string;
  unread_count: number;
};

export type VkConversationsResponse = {
  account_id: string;
  dialogs: VkDialogItem[];
  has_more: boolean;
  next_offset: number;
};

export async function vkUserGetConversations(params: {
  accountId: string;
  offset?: number;
  count?: number;
}): Promise<VkConversationsResponse> {
  const url = new URL(`${API_BASE_URL}/vk-user/conversations`, window.location.origin);
  url.searchParams.set("account_id", params.accountId);
  if (typeof params.offset === "number") url.searchParams.set("offset", String(params.offset));
  if (typeof params.count === "number") url.searchParams.set("count", String(params.count));

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: authHeaders(),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export type VkSubscriptionItem = {
  peer_id: string;
  peer_type: "user" | "chat" | "group";
  title: string;
  enabled: boolean;
  workspace_id: string | null;
  role_id: string | null;
  mention_only: boolean | null;
};

export async function vkUserGetSubscriptions(accountId: string): Promise<{ subscriptions: VkSubscriptionItem[] }> {
  const url = new URL(`${API_BASE_URL}/vk-user/subscriptions`, window.location.origin);
  url.searchParams.set("account_id", accountId);

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: authHeaders(),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function vkUserSaveSubscriptions(params: {
  account_id: string;
  items: Array<{
    peer_id: string;
    peer_type: "user" | "chat" | "group";
    title: string;
    enabled: boolean;
    workspace_id?: string | null;
    role_id?: string | null;
    mention_only?: boolean | null;
  }>;
}): Promise<{ success: true; subscriptions: unknown[] }> {
  const res = await fetch(`${API_BASE_URL}/vk-user/subscriptions`, {
    method: "POST",
    headers: authJsonHeaders(),
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || `HTTP ${res.status}`);
  }
  return res.json();
}


