/**
 * VK API клиент для работы с VK API
 */

const VK_API_VERSION = "5.131";
const VK_API_BASE_URL = "https://api.vk.com/method";

export interface VkApiResponse<T> {
  response?: T;
  error?: {
    error_code: number;
    error_msg: string;
    request_params?: Array<{ key: string; value: string }>;
  };
}

export interface VkUser {
  id: number;
  first_name: string;
  last_name: string;
  photo_200?: string;
  photo_100?: string;
}

export interface VkLongPollServer {
  key: string;
  server: string;
  ts: string;
}

export interface VkLongPollResponse {
  ts: string;
  updates: Array<Array<unknown>>;
}

export interface VkConversation {
  peer: {
    id: number;
    type: string;
    local_id?: number;
  };
  last_message_id: number;
  in_read: number;
  out_read: number;
  sort_id: {
    major_id: number;
    minor_id: number;
  };
  last_conversation_message_id: number;
  important: boolean;
  unanswered: boolean;
  push_settings: {
    sound: number;
    disabled_until: number;
  };
  can_write: {
    allowed: boolean;
    reason?: number;
  };
  chat_settings?: {
    title: string;
    members_count: number;
    state: string;
    photo?: {
      photo_200?: string;
    };
  };
}

/**
 * Создание клиента VK API
 */
export function createVkApiClient(accessToken: string) {
  return {
    /**
     * Выполнение запроса к VK API
     */
    async request<T>(
      method: string,
      params: Record<string, string | number | boolean>
    ): Promise<T> {
      const url = new URL(`${VK_API_BASE_URL}/${method}`);
      url.searchParams.append("access_token", accessToken);
      url.searchParams.append("v", VK_API_VERSION);

      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });

      const response = await fetch(url.toString());
      const data: VkApiResponse<T> = await response.json();

      if (data.error) {
        throw new Error(
          `VK API Error ${data.error.error_code}: ${data.error.error_msg}`
        );
      }

      if (!data.response) {
        throw new Error("VK API: No response data");
      }

      return data.response;
    },
  };
}

/**
 * Получение Long Poll сервера
 */
export async function getLongPollServer(
  accessToken: string
): Promise<VkLongPollServer> {
  const client = createVkApiClient(accessToken);
  return client.request<VkLongPollServer>("messages.getLongPollServer", {
    need_pts: 0,
    lp_version: 3,
  });
}

/**
 * Выполнение Long Poll запроса
 */
export async function longPoll(
  server: string,
  key: string,
  ts: string,
  wait: number = 25
): Promise<VkLongPollResponse> {
  const url = `https://${server}?act=a_check&key=${key}&ts=${ts}&wait=${wait}`;
  const response = await fetch(url);
  const data = await response.json();

  if (data.failed) {
    throw new Error(`Long Poll failed: ${data.failed}`);
  }

  return {
    ts: data.ts,
    updates: data.updates || [],
  };
}

/**
 * Отправка сообщения
 */
export async function sendMessage(
  accessToken: string,
  peerId: number,
  text: string,
  randomId?: number
): Promise<number> {
  const client = createVkApiClient(accessToken);
  const result = await client.request<number>("messages.send", {
    peer_id: peerId,
    message: text,
    random_id: randomId || Math.floor(Math.random() * 2e9),
  });

  return result;
}

/**
 * Получение списка диалогов
 */
export async function getConversations(
  accessToken: string,
  offset: number = 0,
  count: number = 20
): Promise<{
  count: number;
  items: VkConversation[];
}> {
  const client = createVkApiClient(accessToken);
  return client.request<{
    count: number;
    items: VkConversation[];
  }>("messages.getConversations", {
    offset,
    count,
  });
}

/**
 * Получение информации о пользователях
 */
export async function getUserInfo(
  accessToken: string,
  userIds: number[]
): Promise<VkUser[]> {
  const client = createVkApiClient(accessToken);
  return client.request<VkUser[]>("users.get", {
    user_ids: userIds.join(","),
    fields: "photo_200,photo_100",
  });
}
