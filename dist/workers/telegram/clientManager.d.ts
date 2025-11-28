import { NewMessage } from "telegram/events/index.js";
import type { TelegramClientInfo } from "./types.js";
export declare class TelegramClientManager {
    getNewMessageConfig(): NewMessage;
    getActiveAccounts(): Promise<Array<{
        id: string;
        user_id: string;
    }>>;
    createClient(accountId: string, userId: string): Promise<TelegramClientInfo | null>;
}
//# sourceMappingURL=clientManager.d.ts.map