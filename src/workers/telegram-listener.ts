import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import { NewMessage } from "telegram/events/index.js";
import { Api } from "telegram/tl/index.js";
import {
  getTelegramAccount,
  listSubscriptions,
  TelegramSubscription,
  decryptTelegramAccount,
} from "../core/telegram-account-postgres.js";
import { getPostgresPool, closePostgresPool } from "../core/postgres.js";

interface ClientInfo {
  client: TelegramClient;
  accountId: string;
  userId: string;
  phone: string;
}

class TelegramListenerManager {
  private clients = new Map<string, ClientInfo>();
  private isShuttingDown = false;

  /**
   * Инициализация: загружаем все connected аккаунты с enabled подписками
   */
  async initialize() {
    try {
      console.log("🚀 Инициализация Telegram Listener...");

      const accounts = await this.getActiveAccounts();
      console.log(`📋 Найдено ${accounts.length} аккаунтов для прослушивания`);

      for (const account of accounts) {
        await this.startListening(account.id, account.user_id);
      }

      console.log(
        `✅ Инициализировано ${this.clients.size} слушателей Telegram`
      );
    } catch (error) {
      console.error("❌ Ошибка инициализации Telegram Listener:", error);
      // НЕ падаем, продолжаем работу
    }
  }

  /**
   * Получить все аккаунты со статусом connected и хотя бы одной enabled подпиской
   */
  private async getActiveAccounts(): Promise<
    Array<{ id: string; user_id: string }>
  > {
    const pool = getPostgresPool();
    const result = await pool.query<{ id: string; user_id: string }>(
      `
      SELECT DISTINCT ta.id, ta.user_id
      FROM telegram_accounts ta
      INNER JOIN telegram_subscriptions ts ON ts.telegram_account_id = ta.id
      WHERE ta.status = 'connected'
        AND ts.enabled = true
    `
    );
    return result.rows;
  }

  /**
   * Запустить слушатель для конкретного аккаунта
   */
  async startListening(accountId: string, userId: string) {
    if (this.clients.has(accountId)) {
      console.log(`⚠️  Слушатель для ${accountId} уже запущен`);
      return;
    }

    try {
      const account = await getTelegramAccount(accountId, userId);
      if (!account) {
        console.error(`❌ Аккаунт ${accountId} не найден`);
        return;
      }

      if (account.status !== "connected" || !account.session) {
        console.log(
          `⚠️  Аккаунт ${accountId} не подключен или нет сессии, пропускаем`
        );
        return;
      }

      // Расшифровываем данные аккаунта
      const decrypted = decryptTelegramAccount(account);
      if (!decrypted.session) {
        console.error(`❌ Не удалось расшифровать сессию для ${accountId}`);
        return;
      }

      const session = new StringSession(decrypted.session);
      const client = new TelegramClient(
        session,
        decrypted.apiId,
        decrypted.apiHash,
        {
          connectionRetries: Infinity,
          autoReconnect: true,
          retryDelay: 1000,
          useWSS: false,
          timeout: 10,
        }
      );

      await client.connect();

      // Проверяем, что действительно подключены
      if (!client.connected) {
        throw new Error("Не удалось подключиться к Telegram");
      }

      // Обработчик новых сообщений
      client.addEventHandler(async (event: any) => {
        try {
          await this.handleNewMessage(accountId, userId, event);
        } catch (error) {
          console.error(
            `❌ Ошибка обработки сообщения для ${accountId}:`,
            error
          );
          // НЕ падаем, продолжаем слушать
        }
      }, new NewMessage({}));

      this.clients.set(accountId, {
        client,
        accountId,
        userId,
        phone: account.phone || "unknown",
      });

      console.log(
        `✅ Слушатель запущен для ${accountId} (${account.phone || "unknown"})`
      );
    } catch (error) {
      console.error(
        `❌ Не удалось запустить слушатель для ${accountId}:`,
        error
      );

      // Планируем повторную попытку через 30 сек
      if (!this.isShuttingDown) {
        console.log(`🔄 Повторная попытка через 30 сек для ${accountId}`);
        setTimeout(() => this.startListening(accountId, userId), 30000);
      }
    }
  }

  /**
   * Остановить слушатель для конкретного аккаунта
   */
  async stopListening(accountId: string) {
    const clientInfo = this.clients.get(accountId);
    if (!clientInfo) {
      console.log(`⚠️  Слушатель для ${accountId} не найден`);
      return;
    }

    try {
      await clientInfo.client.disconnect();
      this.clients.delete(accountId);
      console.log(`✅ Слушатель остановлен для ${accountId}`);
    } catch (error) {
      console.error(`❌ Ошибка остановки слушателя для ${accountId}:`, error);
    }
  }

  /**
   * Обработка нового сообщения
   */
  private async handleNewMessage(
    accountId: string,
    userId: string,
    event: any
  ) {
    const message = event.message;
    if (!message) return;

    // Игнорируем собственные сообщения (outgoing)
    if (message.out) {
      return;
    }

    // Получаем peer_id
    const peer_id = this.extractPeerId(message.peer_id);
    if (!peer_id) {
      return;
    }

    // Проверяем, есть ли enabled подписка для этого чата
    const subscriptions = await listSubscriptions(accountId, userId);
    const subscription = subscriptions.find(
      s => s.peer_id === peer_id && s.enabled
    );

    if (!subscription) {
      return; // Игнорируем неподключенные чаты
    }

    // Выводим в консоль (пока)
    console.log("\n" + "=".repeat(60));
    console.log(`📨 НОВОЕ СООБЩЕНИЕ`);
    console.log("=".repeat(60));
    console.log(`🔹 Чат: ${subscription.title} (${subscription.peer_type})`);
    console.log(`🔹 Peer ID: ${peer_id}`);
    console.log(`🔹 Sender ID: ${message.senderId?.toString() || "unknown"}`);
    console.log(`🔹 Текст: ${message.text || "(без текста)"}`);
    console.log(`🔹 Workspace: ${subscription.workspace_id}`);
    console.log(`🔹 Role: ${subscription.role_id}`);
    console.log(
      `🔹 Дата: ${new Date(message.date * 1000).toLocaleString("ru")}`
    );
    console.log("=".repeat(60) + "\n");

    // TODO: В будущем здесь будет отправка в LLM и автоответ
  }

  /**
   * Извлечь peer_id из объекта Peer
   */
  private extractPeerId(peer: any): string | null {
    if (!peer) return null;

    // PeerUser
    if (peer.userId) {
      return peer.userId.toString();
    }

    // PeerChat
    if (peer.chatId) {
      return peer.chatId.toString();
    }

    // PeerChannel
    if (peer.channelId) {
      return peer.channelId.toString();
    }

    return null;
  }

  /**
   * Получить статус всех слушателей
   */
  getStatus() {
    const statuses = Array.from(this.clients.values()).map(info => ({
      accountId: info.accountId,
      userId: info.userId,
      phone: info.phone,
      connected: info.client.connected,
    }));

    return {
      activeClients: this.clients.size,
      uptime: process.uptime(),
      accounts: statuses,
    };
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    this.isShuttingDown = true;
    console.log("🛑 Graceful shutdown Telegram Listener...");

    const disconnectPromises = Array.from(this.clients.entries()).map(
      async ([accountId, info]) => {
        try {
          await info.client.disconnect();
          console.log(`✅ Отключен ${accountId}`);
        } catch (error) {
          console.error(`❌ Ошибка отключения ${accountId}:`, error);
        }
      }
    );

    await Promise.allSettled(disconnectPromises);
    this.clients.clear();
    console.log("✅ Все слушатели остановлены");

    // Закрываем пул БД
    await closePostgresPool();
    console.log("✅ БД отключена");
  }
}

// Создаем единственный экземпляр менеджера
const manager = new TelegramListenerManager();

// Инициализация при старте
manager.initialize().catch(error => {
  console.error("💥 Критическая ошибка при инициализации:", error);
  process.exit(1);
});

// Graceful shutdown при SIGTERM (Docker stop)
process.on("SIGTERM", async () => {
  console.log("📡 Получен SIGTERM");
  await manager.shutdown();
  process.exit(0);
});

// Graceful shutdown при SIGINT (Ctrl+C)
process.on("SIGINT", async () => {
  console.log("📡 Получен SIGINT");
  await manager.shutdown();
  process.exit(0);
});

// Обработка необработанных ошибок
process.on("uncaughtException", error => {
  console.error("💥 Uncaught Exception:", error);
  // Логируем, но НЕ падаем
});

process.on("unhandledRejection", reason => {
  console.error("💥 Unhandled Rejection:", reason);
  // Логируем, но НЕ падаем
});

// Экспортируем менеджер для использования в API (опционально)
export { manager };
