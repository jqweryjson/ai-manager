import { API_BASE_URL } from "@shared/config/api";

export interface StartConnectionResponse {
  account_id: string;
  phone_code_hash: string;
}

export interface VerifyResponse {
  success?: boolean;
  requires_2fa?: boolean;
  account_id?: string;
}

export interface StatusResponse {
  accounts: Array<{
    id: string;
    phone: string | null;
    status: "pending_code" | "pending_2fa" | "connected" | "flood_wait";
    flood_wait_until: string | null;
    created_at: string;
  }>;
}

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
      api_id: params.apiId.trim(),
      api_hash: params.apiHash.trim(),
      phone: params.phone.trim(),
    }),
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
    }),
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
    }),
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
): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE_URL}/tg-user/disconnect`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
    },
    body: JSON.stringify({ account_id: accountId }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || `HTTP ${res.status}`);
  }

  return res.json();
}
