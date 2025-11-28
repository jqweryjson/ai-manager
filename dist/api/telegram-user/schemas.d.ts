import { z } from "zod";
export declare const PeerTypeSchema: z.ZodEnum<{
    user: "user";
    chat: "chat";
    channel: "channel";
}>;
export declare const AccountStatusSchema: z.ZodEnum<{
    pending_code: "pending_code";
    pending_2fa: "pending_2fa";
    connected: "connected";
    flood_wait: "flood_wait";
}>;
export declare const StartConnectionSchema: z.ZodObject<{
    api_id: z.ZodPipe<z.ZodPipe<z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>, z.ZodString>, z.ZodTransform<number, string>>;
    api_hash: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>;
    phone: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>;
}, z.core.$strip>;
export declare const VerifyCodeSchema: z.ZodObject<{
    account_id: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>;
    code: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>;
}, z.core.$strip>;
export declare const Verify2FASchema: z.ZodObject<{
    account_id: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>;
    password: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>;
}, z.core.$strip>;
export declare const DisconnectSchema: z.ZodObject<{
    account_id: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>;
}, z.core.$strip>;
export declare const SubscriptionItemInputSchema: z.ZodObject<{
    peer_id: z.ZodString;
    peer_type: z.ZodEnum<{
        user: "user";
        chat: "chat";
        channel: "channel";
    }>;
    title: z.ZodString;
    enabled: z.ZodOptional<z.ZodBoolean>;
    workspace_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    role_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    mention_only: z.ZodOptional<z.ZodBoolean>;
    access_hash: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strip>;
export declare const SaveSubscriptionsRequestSchema: z.ZodObject<{
    account_id: z.ZodString;
    items: z.ZodArray<z.ZodObject<{
        peer_id: z.ZodString;
        peer_type: z.ZodEnum<{
            user: "user";
            chat: "chat";
            channel: "channel";
        }>;
        title: z.ZodString;
        enabled: z.ZodOptional<z.ZodBoolean>;
        workspace_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        role_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        mention_only: z.ZodOptional<z.ZodBoolean>;
        access_hash: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const StartConnectionResponseSchema: z.ZodObject<{
    account_id: z.ZodString;
    phone_code_hash: z.ZodString;
}, z.core.$strip>;
export declare const VerifyResponseSchema: z.ZodObject<{
    success: z.ZodOptional<z.ZodBoolean>;
    requires_2fa: z.ZodOptional<z.ZodBoolean>;
    account_id: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const TelegramAccountSchema: z.ZodObject<{
    id: z.ZodString;
    phone: z.ZodNullable<z.ZodString>;
    status: z.ZodEnum<{
        pending_code: "pending_code";
        pending_2fa: "pending_2fa";
        connected: "connected";
        flood_wait: "flood_wait";
    }>;
    flood_wait_until: z.ZodNullable<z.ZodString>;
    created_at: z.ZodString;
}, z.core.$strip>;
export declare const StatusResponseSchema: z.ZodObject<{
    accounts: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        phone: z.ZodNullable<z.ZodString>;
        status: z.ZodEnum<{
            pending_code: "pending_code";
            pending_2fa: "pending_2fa";
            connected: "connected";
            flood_wait: "flood_wait";
        }>;
        flood_wait_until: z.ZodNullable<z.ZodString>;
        created_at: z.ZodString;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const DisconnectResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
}, z.core.$strip>;
export declare const DialogItemSchema: z.ZodObject<{
    peer_id: z.ZodString;
    peer_type: z.ZodEnum<{
        user: "user";
        chat: "chat";
        channel: "channel";
    }>;
    title: z.ZodString;
    unread_count: z.ZodNumber;
    access_hash: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strip>;
export declare const DialogsResponseSchema: z.ZodObject<{
    account_id: z.ZodString;
    dialogs: z.ZodArray<z.ZodObject<{
        peer_id: z.ZodString;
        peer_type: z.ZodEnum<{
            user: "user";
            chat: "chat";
            channel: "channel";
        }>;
        title: z.ZodString;
        unread_count: z.ZodNumber;
        access_hash: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, z.core.$strip>>;
    has_more: z.ZodBoolean;
    next_offset_date: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const ContactsResponseSchema: z.ZodObject<{
    account_id: z.ZodString;
    dialogs: z.ZodArray<z.ZodObject<{
        peer_id: z.ZodString;
        peer_type: z.ZodEnum<{
            user: "user";
            chat: "chat";
            channel: "channel";
        }>;
        title: z.ZodString;
        unread_count: z.ZodNumber;
        access_hash: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const AllDialogsResponseSchema: z.ZodObject<{
    account_id: z.ZodString;
    dialogs: z.ZodArray<z.ZodObject<{
        peer_id: z.ZodString;
        peer_type: z.ZodEnum<{
            user: "user";
            chat: "chat";
            channel: "channel";
        }>;
        title: z.ZodString;
        unread_count: z.ZodNumber;
        access_hash: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const SubscriptionItemSchema: z.ZodObject<{
    peer_id: z.ZodString;
    peer_type: z.ZodEnum<{
        user: "user";
        chat: "chat";
        channel: "channel";
    }>;
    title: z.ZodString;
    enabled: z.ZodBoolean;
    workspace_id: z.ZodNullable<z.ZodString>;
    role_id: z.ZodNullable<z.ZodString>;
    mention_only: z.ZodBoolean;
    access_hash: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strip>;
export declare const GetSubscriptionsResponseSchema: z.ZodObject<{
    subscriptions: z.ZodArray<z.ZodObject<{
        peer_id: z.ZodString;
        peer_type: z.ZodEnum<{
            user: "user";
            chat: "chat";
            channel: "channel";
        }>;
        title: z.ZodString;
        enabled: z.ZodBoolean;
        workspace_id: z.ZodNullable<z.ZodString>;
        role_id: z.ZodNullable<z.ZodString>;
        mention_only: z.ZodBoolean;
        access_hash: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const SaveSubscriptionsResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    subscriptions: z.ZodArray<z.ZodObject<{
        peer_id: z.ZodString;
        peer_type: z.ZodEnum<{
            user: "user";
            chat: "chat";
            channel: "channel";
        }>;
        title: z.ZodString;
        enabled: z.ZodBoolean;
        workspace_id: z.ZodNullable<z.ZodString>;
        role_id: z.ZodNullable<z.ZodString>;
        mention_only: z.ZodBoolean;
        access_hash: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        id: z.ZodString;
        telegram_account_id: z.ZodString;
        created_at: z.ZodString;
        updated_at: z.ZodString;
    }, z.core.$strip>>;
}, z.core.$strip>;
//# sourceMappingURL=schemas.d.ts.map