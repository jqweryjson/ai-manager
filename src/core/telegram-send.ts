import { Api } from "telegram/tl/index.js";
import { TelegramClient } from "telegram";
import bigInt from "big-integer";
import {
  getTelegramAccount,
  decryptTelegramAccount,
} from "./telegram-account-postgres.js";
import { createClient } from "./telegram-mtproto.js";

/**
 * Безопасное отключение клиента с игнорированием TIMEOUT-ошибок из update loop
 */
async function safeDisconnect(client: TelegramClient): Promise<void> {
  try {
    if (client.connected) {
      await client.disconnect();
    }
  } catch (error: any) {
    if (
      error?.message?.includes("TIMEOUT") ||
      error?.message?.includes("update")
    ) {
      return;
    }
    throw error;
  }
}

/**
 * Результат отправки сообщения
 */
export interface SendTelegramMessageResult {
  success: boolean;
  floodWaitSeconds?: number | null;
  error?: string;
}

/**
 * Парсинг FLOOD_WAIT из ошибки Telegram
 * @param error - Ошибка от Telegram API
 * @returns Количество секунд ожидания или null, если это не FLOOD_WAIT
 */
function parseFloodWait(error: any): number | null {
  // Проверяем, есть ли поле seconds в ошибке
  if (error?.seconds && typeof error.seconds === "number") {
    return error.seconds;
  }

  // Проверяем errorMessage на наличие FLOOD_WAIT
  const errorMessage = error?.errorMessage || error?.message || String(error);

  // Паттерн: "FLOOD_WAIT_818" или "A wait of 818 seconds"
  const floodWaitMatch = errorMessage.match(/FLOOD_WAIT[_\s](\d+)/i);
  if (floodWaitMatch) {
    return parseInt(floodWaitMatch[1], 10);
  }

  // Паттерн: "A wait of 818 seconds"
  const waitMatch = errorMessage.match(/wait of (\d+) seconds/i);
  if (waitMatch) {
    return parseInt(waitMatch[1], 10);
  }

  return null;
}

/**
 * Отправка сообщения в Telegram от имени user-бота
 */
export async function sendTelegramMessage(
  accountId: string,
  userId: string,
  peerId: string,
  peerType: "user" | "chat" | "channel",
  text: string,
  accessHash?: string | null
): Promise<SendTelegramMessageResult> {
  const account = await getTelegramAccount(accountId, userId);
  if (!account) {
    throw new Error("Telegram account not found");
  }
  if (account.status !== "connected" || !account.session) {
    throw new Error("Telegram account is not connected");
  }

  const decrypted = decryptTelegramAccount(account);
  if (!decrypted.session) {
    throw new Error("Telegram session is missing");
  }

  const client = createClient(
    decrypted.apiId,
    decrypted.apiHash,
    decrypted.session
  );

  try {
    if (!client.connected) {
      await client.connect();
    }

    // Строим Peer в зависимости от типа
    // GramJS использует BigInteger из библиотеки big-integer
    const idBigInt = bigInt(peerId);

    console.log(
      `[sendTelegramMessage] peerId=${peerId}, peerType=${peerType}, accessHash=${accessHash || "null"}`
    );

    let entity: Api.TypePeer | Api.TypeInputPeer;
    if (peerType === "user") {
      if (accessHash) {
        entity = new Api.InputPeerUser({
          userId: idBigInt,
          accessHash: bigInt(accessHash),
        });
      } else {
        entity = new Api.PeerUser({ userId: idBigInt });
      }
    } else if (peerType === "chat") {
      if (accessHash) {
        // Супергруппа (megagroup) отдаёт peer_type=chat, но требует channel peer
        entity = new Api.InputPeerChannel({
          channelId: idBigInt,
          accessHash: bigInt(accessHash),
        });
      } else {
        entity = new Api.PeerChat({ chatId: idBigInt });
      }
    } else {
      if (!accessHash) {
        throw new Error("Missing access hash for channel peer");
      }
      entity = new Api.InputPeerChannel({
        channelId: idBigInt,
        accessHash: bigInt(accessHash),
      });
    }

    await client.sendMessage(entity, { message: text });

    console.log(
      `✅ Сообщение успешно отправлено в Telegram: ${peerId} (${peerType})`
    );

    return {
      success: true,
      floodWaitSeconds: null,
    };
  } catch (error: any) {
    // Парсим FLOOD_WAIT из ошибки
    const floodWaitSeconds = parseFloodWait(error);

    if (floodWaitSeconds !== null) {
      console.error(
        `⏸️  FLOOD_WAIT: Чат ${peerId} заблокирован на ${floodWaitSeconds} секунд`
      );
      return {
        success: false,
        floodWaitSeconds,
        error: `FLOOD_WAIT: A wait of ${floodWaitSeconds} seconds is required`,
      };
    }

    // Другая ошибка
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ Ошибка отправки сообщения в Telegram: ${errorMessage}`);

    return {
      success: false,
      floodWaitSeconds: null,
      error: `Failed to send Telegram message: ${errorMessage}`,
    };
  } finally {
    await safeDisconnect(client);
  }
}
