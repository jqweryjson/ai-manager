import { z } from "zod";
export const StartConnectionSchema = z.object({
    api_id: z
        .string()
        .transform(val => val.trim())
        .pipe(z.string().refine(val => {
        const num = parseInt(val, 10);
        return !isNaN(num) && num > 0;
    }, { message: "API ID должен быть положительным числом" }))
        .transform(val => parseInt(val, 10)),
    api_hash: z
        .string()
        .min(1)
        .transform(val => val.trim()),
    phone: z
        .string()
        .min(1)
        .transform(val => val.trim()),
});
export const VerifyCodeSchema = z.object({
    account_id: z
        .string()
        .min(1)
        .transform(val => val.trim()),
    code: z
        .string()
        .min(1)
        .transform(val => val.trim()),
});
export const Verify2FASchema = z.object({
    account_id: z
        .string()
        .min(1)
        .transform(val => val.trim()),
    password: z
        .string()
        .min(1)
        .transform(val => val.trim()),
});
export const DisconnectSchema = z.object({
    account_id: z
        .string()
        .min(1)
        .transform(val => val.trim()),
});
export const SubscriptionsSchema = z.object({
    account_id: z.string().min(1),
    items: z
        .array(z
        .object({
        peer_id: z.string().min(1),
        peer_type: z.enum(["user", "chat", "channel"]),
        title: z.string().min(1),
        enabled: z.boolean().optional(),
        workspace_id: z.string().nullable().optional(),
        role_id: z.string().nullable().optional(),
    })
        .refine(data => {
        // Бизнес-правило: если enabled=true, то workspace_id и role_id обязательны
        if (data.enabled && (!data.workspace_id || !data.role_id)) {
            return false;
        }
        return true;
    }, {
        message: "workspace_id и role_id обязательны когда enabled=true",
    }))
        .min(1),
});
//# sourceMappingURL=schemas.js.map