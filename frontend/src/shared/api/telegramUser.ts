import { API_BASE_URL } from "@shared/config/api";
import type {
  StartConnectionRequest,
  StartConnectionResponse,
  VerifyCodeRequest,
  VerifyResponse,
  Verify2FARequest,
  StatusResponse,
  DisconnectRequest,
  DisconnectResponse,
  DialogItem,
  DialogsResponse,
  DialogsPageParams,
  ContactsResponse,
  GetContactsParams,
  AllDialogsResponse,
  GetAllDialogsParams,
  SubscriptionItem,
  GetSubscriptionsResponse,
  SubscriptionItemInput,
  SaveSubscriptionsRequest,
  SaveSubscriptionsResponse,
} from "./contracts";

export async function startConnection(params: {
  apiId: string;
  apiHash: string;
  phone: string;
}): Promise<StartConnectionResponse> {
  const res = await fetch(`${API_BASE_URL}/tg-user/start`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
    },
    body: JSON.stringify({
      api_id: params?.apiId?.trim(),
      api_hash: params?.apiHash?.trim(),
      phone: params?.phone?.trim(),
    } satisfies StartConnectionRequest),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export async function verifyCode(params: {
  accountId: string;
  code: string;
}): Promise<VerifyResponse> {
  const res = await fetch(`${API_BASE_URL}/tg-user/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
    },
    body: JSON.stringify({
      account_id: params.accountId,
      code: params.code,
    } satisfies VerifyCodeRequest),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export async function verify2FA(params: {
  accountId: string;
  password: string;
}): Promise<VerifyResponse> {
  const res = await fetch(`${API_BASE_URL}/tg-user/2fa`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
    },
    body: JSON.stringify({
      account_id: params.accountId,
      password: params.password,
    } satisfies Verify2FARequest),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export async function getStatus(): Promise<StatusResponse> {
  const res = await fetch(`${API_BASE_URL}/tg-user/status`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export async function disconnect(
  accountId: string
): Promise<DisconnectResponse> {
  const res = await fetch(`${API_BASE_URL}/tg-user/disconnect`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
    },
    body: JSON.stringify({ account_id: accountId } satisfies DisconnectRequest),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || `HTTP ${res.status}`);
  }

  return res.json();
}

// Re-export types for convenience
export type { DialogItem, DialogsResponse, DialogsPageParams };

export async function getDialogs(
  params?: DialogsPageParams
): Promise<DialogsResponse> {
  const url = new URL(
    `${API_BASE_URL}/tg-user/dialogs`,
    window.location.origin
  );
  if (params?.accountId) {
    url.searchParams.set("account_id", params.accountId);
  }
  if (params?.limit) {
    url.searchParams.set("limit", String(params.limit));
  }
  if (params?.offsetDate) {
    url.searchParams.set("offset_date", params.offsetDate);
  }
  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function getUserContacts(
  params?: GetContactsParams
): Promise<ContactsResponse> {
  const url = new URL(
    `${API_BASE_URL}/tg-user/contacts`,
    window.location.origin
  );
  if (params?.accountId) {
    url.searchParams.set("account_id", params.accountId);
  }
  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function getUserDialogs(
  params?: GetAllDialogsParams
): Promise<AllDialogsResponse> {
  const url = new URL(
    `${API_BASE_URL}/tg-user/all-dialogs`,
    window.location.origin
  );
  if (params?.accountId) {
    url.searchParams.set("account_id", params.accountId);
  }
  if (params?.limit) {
    url.searchParams.set("limit", String(params.limit));
  }
  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function getSubscriptions(
  accountId: string
): Promise<GetSubscriptionsResponse> {
  const url = new URL(
    `${API_BASE_URL}/tg-user/subscriptions`,
    window.location.origin
  );
  url.searchParams.set("account_id", accountId);
  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function saveSubscriptions(
  params: SaveSubscriptionsRequest
): Promise<SaveSubscriptionsResponse> {
  const res = await fetch(`${API_BASE_URL}/tg-user/subscriptions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
    },
    body: JSON.stringify(params satisfies SaveSubscriptionsRequest),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// Re-export contract types
export type {
  StartConnectionRequest,
  StartConnectionResponse,
  VerifyCodeRequest,
  VerifyResponse,
  Verify2FARequest,
  StatusResponse,
  DisconnectRequest,
  DisconnectResponse,
  ContactsResponse,
  GetContactsParams,
  AllDialogsResponse,
  GetAllDialogsParams,
  SubscriptionItem,
  GetSubscriptionsResponse,
  SubscriptionItemInput,
  SaveSubscriptionsRequest,
  SaveSubscriptionsResponse,
};
