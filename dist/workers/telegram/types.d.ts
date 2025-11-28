import type { TelegramClient } from "telegram";
export interface TelegramClientInfo {
    client: TelegramClient;
    accountId: string;
    userId: string;
    phone: string;
}
export interface TelegramEvent {
    account_id: string;
    user_id: string;
    peer_id: string;
    peer_type: "user" | "chat" | "channel";
    access_hash?: string | null;
    workspace_id: string | null;
    role_id: string | null;
    is_outgoing?: boolean;
    message: {
        id: string;
        text: string | null;
        senderId?: string;
        date: number;
    };
}
//# sourceMappingURL=types.d.ts.map