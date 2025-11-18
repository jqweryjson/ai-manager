import { z } from "zod";
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
export declare const SubscriptionsSchema: z.ZodObject<{
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
    }, z.core.$strip>>;
}, z.core.$strip>;
//# sourceMappingURL=schemas.d.ts.map