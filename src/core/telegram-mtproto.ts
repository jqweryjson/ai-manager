import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import { Api } from "telegram/tl";
import crypto from "crypto";

type DialogSummary = {
  peerId: string;
  peerType: "user" | "chat" | "channel";
  title: string;
  unreadCount: number;
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

  return new TelegramClient(session, apiId, apiHash, {
    connectionRetries: 5,
  });
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
 * Загружает список диалогов (личные, группы, каналы)
 * Возвращает упрощённое представление для UI.
 */
export async function getDialogsSummary(
  client: TelegramClient,
  limit: number = 100
): Promise<DialogSummary[]> {
  try {
    if (!client.connected) {
      await client.connect();
    }
    // Используем high-level API gramjs
    const dialogs = await (client as any).getDialogs({ limit });
    if (!Array.isArray(dialogs)) {
      return [];
    }
    const result: DialogSummary[] = [];

    for (const d of dialogs) {
      try {
        // d.entity содержит User/Chat/Channel
        const entity = d.entity;
        const title: string =
          d.title ?? entity?.title ?? entity?.firstName ?? "Unknown";
        const unreadCount: number = d.unreadCount ?? 0;

        let peerType: "user" | "chat" | "channel" = "chat";
        let peerIdStr = "";

        if (entity?._ === "User") {
          peerType = "user";
          peerIdStr = String(entity.id);
        } else if (entity?._ === "Channel") {
          peerType = "channel";
          peerIdStr = String(entity.id);
        } else if (entity?._ === "Chat") {
          peerType = "chat";
          peerIdStr = String(entity.id);
        } else if (typeof entity?.id !== "undefined") {
          // fallback
          peerIdStr = String(entity.id);
        }

        if (peerIdStr) {
          result.push({
            peerId: peerIdStr,
            peerType,
            title,
            unreadCount,
          });
        }
      } catch {
        // пропускаем проблемный диалог
      }
    }
    return result;
  } catch (error) {
    throw new Error(
      `Failed to get dialogs: ${error instanceof Error ? error.message : String(error)}`
    );
  } finally {
    await safeDisconnect(client);
  }
}
