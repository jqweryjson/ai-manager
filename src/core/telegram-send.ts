import { Api } from "telegram/tl";
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
 * Отправка сообщения в Telegram от имени user-бота
 */
export async function sendTelegramMessage(
  accountId: string,
  userId: string,
  peerId: string,
  peerType: "user" | "chat" | "channel",
  text: string,
  accessHash?: string | null
): Promise<void> {
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
  } catch (error: any) {
    throw new Error(
      `Failed to send Telegram message: ${error instanceof Error ? error.message : String(error)}`
    );
  } finally {
    await safeDisconnect(client);
  }
}
