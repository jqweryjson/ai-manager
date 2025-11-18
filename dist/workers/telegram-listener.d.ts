declare class TelegramListenerManager {
    private clients;
    private isShuttingDown;
    /**
     * Инициализация: загружаем все connected аккаунты с enabled подписками
     */
    initialize(): Promise<void>;
    /**
     * Получить все аккаунты со статусом connected и хотя бы одной enabled подпиской
     */
    private getActiveAccounts;
    /**
     * Запустить слушатель для конкретного аккаунта
     */
    startListening(accountId: string, userId: string): Promise<void>;
    /**
     * Остановить слушатель для конкретного аккаунта
     */
    stopListening(accountId: string): Promise<void>;
    /**
     * Обработка нового сообщения
     */
    private handleNewMessage;
    /**
     * Извлечь peer_id из объекта Peer
     */
    private extractPeerId;
    /**
     * Получить статус всех слушателей
     */
    getStatus(): {
        activeClients: number;
        uptime: number;
        accounts: {
            accountId: string;
            userId: string;
            phone: string;
            connected: boolean | undefined;
        }[];
    };
    /**
     * Graceful shutdown
     */
    shutdown(): Promise<void>;
}
declare const manager: TelegramListenerManager;
export { manager };
//# sourceMappingURL=telegram-listener.d.ts.map