import { z } from "zod";
/**
 * Схема для начала OAuth авторизации
 */
export declare const StartConnectionSchema: z.ZodObject<{}, z.core.$strip>;
/**
 * Схема для OAuth callback
 */
export declare const OAuthCallbackSchema: z.ZodObject<{
    code: z.ZodString;
    state: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
/**
 * Схема для сохранения подписок
 */
export declare const SaveSubscriptionsSchema: z.ZodObject<{
    account_id: z.ZodString;
    items: z.ZodArray<z.ZodObject<{
        peer_id: z.ZodString;
        peer_type: z.ZodEnum<{
            user: "user";
            chat: "chat";
            group: "group";
        }>;
        title: z.ZodString;
        enabled: z.ZodBoolean;
        workspace_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        role_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        mention_only: z.ZodOptional<z.ZodNullable<z.ZodBoolean>>;
    }, z.core.$strip>>;
}, z.core.$strip>;
/**
 * Схема для отправки сообщения
 */
export declare const SendMessageSchema: z.ZodObject<{
    account_id: z.ZodString;
    peer_id: z.ZodString;
    peer_type: z.ZodEnum<{
        user: "user";
        chat: "chat";
        group: "group";
    }>;
    text: z.ZodString;
}, z.core.$strip>;
//# sourceMappingURL=schemas.d.ts.map