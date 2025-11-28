import { closePostgresPool } from "../core/postgres.js";
import { TelegramClientManager } from "./telegram/clientManager.js";
import { MessageProcessor } from "./telegram/messageProcessor.js";
import { EventSender } from "./telegram/eventSender.js";
import type { TelegramClientInfo } from "./telegram/types.js";

class TelegramListenerManager {
  private clients = new Map<string, TelegramClientInfo>();
  private isShuttingDown = false;
  private clientManager = new TelegramClientManager();
  private messageProcessor = new MessageProcessor();
  private eventSender = new EventSender();

  /**
   * Инициализация: загружаем все connected аккаунты с enabled подписками
   */
  async initialize() {
    try {
      console.log("🚀 Инициализация Telegram Listener...");

      const accounts = await this.clientManager.getActiveAccounts();
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
   * Запустить слушатель для конкретного аккаунта
   */
  async startListening(accountId: string, userId: string) {
    if (this.clients.has(accountId)) {
      console.log(`⚠️  Слушатель для ${accountId} уже запущен`);
      return;
    }

    try {
      const clientInfo = await this.clientManager.createClient(
        accountId,
        userId
      );
      if (!clientInfo) {
        return;
      }

      const { client } = clientInfo;

      client.addEventHandler(async event => {
        try {
          await this.handleNewMessage(accountId, userId, event);
        } catch (error) {
          console.error(
            `❌ Ошибка обработки сообщения для ${accountId}:`,
            error
          );
        }
      }, this.clientManager.getNewMessageConfig());

      this.clients.set(accountId, clientInfo);

      console.log(
        `✅ Слушатель запущен для ${accountId} (${clientInfo.phone})`
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
    messageEvent: any
  ) {
    const message = messageEvent.message;
    if (!message) {
      console.log("⚠️  Событие без message");
      return;
    }

    // Игнорируем собственные сообщения (outgoing)
    if (message.out) {
      console.log(
        `⏭️  Пропущено исходящее сообщение от ${accountId} в ${message.peer_id?.userId || message.peer_id?.chatId || message.peer_id?.channelId || "unknown"}`
      );
      return;
    }

    console.log("🔎 Детали входящего сообщения", {
      accountId,
      messageId: message.id,
      className: message.className,
      peer_id: message.peer_id,
      peerId: message.peerId,
      toId: message.toId,
      fromId: message.fromId,
      chat: message.chat,
      message: message.message ?? message.text,
    });

    // Получаем peer_id
    const peer_id = this.messageProcessor.extractPeerId(
      message.peer_id || message.peerId
    );
    if (!peer_id) {
      console.log(
        `⚠️  Не удалось извлечь peer_id из события. peer_id:`,
        JSON.stringify(message.peer_id ?? message.peerId)
      );
      console.log("🔍 Структура message:", {
        id: message.id,
        className: message.className,
        peer_id: message.peer_id,
        peerId: message.peerId,
        toId: message.toId,
        fromId: message.fromId,
      });
      return;
    }

    // Проверяем, есть ли enabled подписка для этого чата
    const event = await this.messageProcessor.buildEvent(
      accountId,
      userId,
      peer_id,
      message
    );

    if (!event) {
      return;
    }

    await this.eventSender.send(event);
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
