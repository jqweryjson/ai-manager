import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import { Api } from "telegram/tl";

// Фильтруем TIMEOUT ошибки из GramJS update loop
// Это нормальное поведение для long-polling, но не должно засорять консоль
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  // Проверяем, это ли ошибка TIMEOUT из updates.js
  const firstArg = args[0];
  if (
    firstArg instanceof Error &&
    firstArg.message === "TIMEOUT" &&
    firstArg.stack?.includes("telegram/client/updates.js")
  ) {
    // Игнорируем эту ошибку
    return;
  }
  // Все остальные ошибки пропускаем к оригинальному console.error
  originalConsoleError.apply(console, args);
};

type DialogSummary = {
  peer_id: string;
  peer_type: "user" | "chat" | "channel";
  title: string;
  unread_count: number;
};

type GetDialogsResult = {
  dialogs: DialogSummary[];
  hasMore: boolean;
  nextOffsetDate?: string; // ISO string для передачи через API
};

/**
 * Создаёт новый TelegramClient
 * @param apiId - API ID из my.telegram.org
 * @param apiHash - API Hash из my.telegram.org
 * @param sessionString - опциональная строка сессии для восстановления
 * @returns TelegramClient
 */
export function createClient(
  apiId: number,
  apiHash: string,
  sessionString?: string
): TelegramClient {
  const session = new StringSession(sessionString || "");

  const client = new TelegramClient(session, apiId, apiHash, {
    connectionRetries: 5,
    // Отключаем автоматические обновления (update loop)
    // т.к. нам не нужны real-time обновления для stateless API
    useWSS: false,
    timeout: 10, // 10 секунд таймаут для запросов
  });

  // Полностью отключаем update loop для stateless операций
  // Это предотвращает бесконечные TIMEOUT ошибки в консоли
  (client as any).updates = {
    isConnected: () => false,
    _updateLoop: () => Promise.resolve(),
  };

  return client;
}

/**
 * Безопасно отключает клиент, игнорируя ошибки таймаута из update loop
 * @param client - TelegramClient
 */
async function safeDisconnect(client: TelegramClient): Promise<void> {
  try {
    if (client.connected) {
      await client.disconnect();
    }
  } catch (error: any) {
    // Игнорируем ошибки таймаута из update loop - это нормальное поведение GramJS
    // при быстром отключении после короткой операции
    if (
      error?.message?.includes("TIMEOUT") ||
      error?.message?.includes("update")
    ) {
      // Это не критичная ошибка, просто логируем на уровне debug
      return;
    }
    // Пробрасываем другие ошибки
    throw error;
  }
}

/**
 * Отправляет код авторизации на телефон
 * @param client - TelegramClient
 * @param phone - номер телефона в международном формате
 * @returns phoneCodeHash для последующей авторизации
 */
export async function sendCode(
  client: TelegramClient,
  phone: string
): Promise<string> {
  try {
    // Подключаемся, если еще не подключены
    if (!client.connected) {
      await client.connect();
    }

    const result = await client.invoke(
      new Api.auth.SendCode({
        phoneNumber: phone,
        apiId: client.apiId!,
        apiHash: client.apiHash!,
        settings: new Api.CodeSettings({}),
      })
    );

    // result может быть SentCode или SentCodeSuccess
    if (result instanceof Api.auth.SentCode) {
      return result.phoneCodeHash;
    }
    // Если это SentCodeSuccess, значит уже авторизован
    throw new Error("Already authorized");
  } catch (error) {
    throw new Error(
      `Failed to send code: ${error instanceof Error ? error.message : String(error)}`
    );
  } finally {
    // Всегда отключаемся после операции
    await safeDisconnect(client);
  }
}

/**
 * Авторизуется по коду
 * @param client - TelegramClient
 * @param phone - номер телефона
 * @param code - код из Telegram
 * @param phoneCodeHash - hash из sendCode
 * @returns результат авторизации
 */
export async function signIn(
  client: TelegramClient,
  phone: string,
  code: string,
  phoneCodeHash: string
): Promise<{ success: boolean; requires2FA: boolean }> {
  try {
    // Подключаемся, если еще не подключены
    if (!client.connected) {
      await client.connect();
    }

    await client.invoke(
      new Api.auth.SignIn({
        phoneNumber: phone,
        phoneCodeHash,
        phoneCode: code,
      })
    );

    return { success: true, requires2FA: false };
  } catch (error: any) {
    // Проверяем, требуется ли 2FA
    if (
      error?.errorMessage === "SESSION_PASSWORD_NEEDED" ||
      error?.code === 401
    ) {
      return { success: false, requires2FA: true };
    }

    throw new Error(
      `Failed to sign in: ${error instanceof Error ? error.message : String(error)}`
    );
  } finally {
    // Всегда отключаемся после операции
    await safeDisconnect(client);
  }
}

/**
 * Завершает авторизацию с 2FA паролем
 * @param client - TelegramClient
 * @param password - пароль 2FA
 */
export async function signInWithPassword(
  client: TelegramClient,
  password: string
): Promise<void> {
  try {
    // Подключаемся, если еще не подключены
    if (!client.connected) {
      await client.connect();
    }

    // Получаем информацию о пароле для вычисления SRP
    const passwordInfo = await client.invoke(new Api.account.GetPassword());

    if (!passwordInfo) {
      throw new Error("Password info not available");
    }

    // Используем встроенный метод gramjs для вычисления SRP
    // gramjs имеет встроенную функцию для работы с паролями
    const result = await client.invoke(
      new Api.auth.CheckPassword({
        password: await (client as any).checkPassword(password, passwordInfo),
      })
    );

    // Если успешно, сессия уже обновлена в клиенте
    return;
  } catch (error: any) {
    // Fallback: пробуем использовать встроенный метод если доступен
    if (typeof (client as any).checkPassword === "function") {
      try {
        const passwordInfo = await client.invoke(new Api.account.GetPassword());
        await (client as any).checkPassword(password, passwordInfo);
        return;
      } catch (fallbackError) {
        // Игнорируем и пробрасываем оригинальную ошибку
      }
    }

    throw new Error(
      `Failed to sign in with password: ${error instanceof Error ? error.message : String(error)}`
    );
  } finally {
    // Всегда отключаемся после операции
    await safeDisconnect(client);
  }
}

/**
 * Получает строку сессии для сохранения
 * @param client - TelegramClient
 * @returns строка сессии
 */
export function getSessionString(client: TelegramClient): string {
  if (client.session instanceof StringSession) {
    return client.session.save() as string;
  }
  throw new Error("Session is not a StringSession");
}

/**
 * Восстанавливает клиент из строки сессии
 * @param sessionString - строка сессии
 * @param apiId - API ID
 * @param apiHash - API Hash
 * @returns TelegramClient
 */
export function restoreSession(
  sessionString: string,
  apiId: number,
  apiHash: string
): TelegramClient {
  return createClient(apiId, apiHash, sessionString);
}

/**
 * Преобразует диалог GramJS в DialogSummary
 * @param d - объект диалога с entity или сам entity
 */
function parseDialog(d: any): DialogSummary | null {
  try {
    // Если d уже entity (из SearchGlobal), используем его напрямую
    const entity = d.entity || d;
    const title: string =
      d.title ?? entity?.title ?? entity?.firstName ?? "Unknown";
    const unread_сount: number = d.unread_сount ?? 0;

    let peer_type: "user" | "chat" | "channel" = "chat";
    let peerIdStr = "";

    const entityType =
      entity?.className || entity?.constructor?.name || entity?._;

    if (entityType === "User" || entity?._ === "User") {
      peer_type = "user";
      peerIdStr = String(entity.id);
    } else if (entityType === "Channel" || entity?._ === "Channel") {
      if (entity?.megagroup) {
        peer_type = "chat"; // Супергруппа = чат
      } else {
        peer_type = "channel"; // Обычный канал
      }
      peerIdStr = String(entity.id);
    } else if (entityType === "Chat" || entity?._ === "Chat") {
      peer_type = "chat";
      peerIdStr = String(entity.id);
    } else if (typeof entity?.id !== "undefined") {
      peerIdStr = String(entity.id);
    }

    if (peerIdStr) {
      return {
        peer_id: peerIdStr,
        peer_type,
        title,
        unread_count: unread_сount,
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Загружает список диалогов (личные, группы, каналы) с пагинацией
 * Возвращает упрощённое представление для UI.
 */
export async function getDialogsSummary(
  client: TelegramClient,
  limit: number = 50,
  offsetDate?: Date
): Promise<GetDialogsResult> {
  try {
    if (!client.connected) {
      await client.connect();
    }

    // GramJS ожидает offsetDate как число (Unix timestamp в секундах), а не Date
    const offsetDateSeconds = offsetDate
      ? Math.floor(offsetDate.getTime() / 1000)
      : undefined;

    const dialogs = await (client as any).getDialogs({
      limit,
      offsetDate: offsetDateSeconds,
    });

    if (!Array.isArray(dialogs)) {
      return { dialogs: [], hasMore: false };
    }

    const result: DialogSummary[] = [];
    let lastDate: Date | undefined;

    for (const d of dialogs) {
      const parsed = parseDialog(d);
      if (parsed) {
        result.push(parsed);
        // Сохраняем дату последнего сообщения для пагинации
        if (d.date) {
          // Преобразуем d.date в Date, если это необходимо
          let dateObj: Date;
          if (d.date instanceof Date) {
            dateObj = d.date;
          } else if (typeof d.date === "number") {
            // Timestamp в секундах (Telegram использует Unix timestamp)
            dateObj = new Date(d.date * 1000);
          } else if (typeof d.date === "bigint") {
            dateObj = new Date(Number(d.date) * 1000);
          } else {
            // Пробуем преобразовать через конструктор Date
            dateObj = new Date(d.date as any);
          }

          if (!isNaN(dateObj.getTime()) && (!lastDate || dateObj < lastDate)) {
            lastDate = dateObj;
          }
        }
      }
    }

    // Если получили меньше чем limit, значит больше нет
    const hasMore = dialogs.length >= limit;

    const response: GetDialogsResult = {
      dialogs: result,
      hasMore,
    };
    if (hasMore && lastDate) {
      response.nextOffsetDate = lastDate.toISOString();
    }
    return response;
  } catch (error) {
    throw new Error(
      `Failed to get dialogs: ${error instanceof Error ? error.message : String(error)}`
    );
  } finally {
    await safeDisconnect(client);
  }
}

/**
 * Поиск контактов по имени
 */
export async function getUserContacts(
  client: TelegramClient
): Promise<DialogSummary[]> {
  try {
    if (!client.connected) {
      await client.connect();
    }

    const result = await client.invoke(new Api.contacts.GetContacts({}));

    if (!result || !("users" in result)) {
      return [];
    }

    const dialogs: DialogSummary[] = [];

    for (const user of result.users || []) {
      // Безопасный доступ к свойствам пользователя
      const firstName = (user as any).firstName || "";
      const username = (user as any).username || "";
      const title = firstName || username || "Unknown";

      const parsed = parseDialog({
        entity: user,
        title,
        unread_сount: 0,
      });
      if (parsed) {
        dialogs.push(parsed);
      }
    }

    return dialogs;
  } catch (error) {
    throw new Error(
      `Failed to get contacts: ${error instanceof Error ? error.message : String(error)}`
    );
  } finally {
    await safeDisconnect(client);
  }
}

/**
 * Поиск чатов/групп/каналов по названию (фильтрация из всех диалогов)
 */
export async function getUserDialogs(
  client: TelegramClient,
  limit: number = 1000
): Promise<DialogSummary[]> {
  try {
    if (!client.connected) {
      await client.connect();
    }

    // Получаем все диалоги с большим лимитом
    const allDialogs = await getDialogsSummary(client, limit);

    return allDialogs.dialogs;
  } catch (error) {
    throw new Error(
      `Failed to get dialogs: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
