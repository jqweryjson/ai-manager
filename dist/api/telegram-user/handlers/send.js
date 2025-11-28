import { sendTelegramMessage } from "../../../core/telegram-send.js";
import { z } from "zod";
const SendMessageRequestSchema = z.object({
    account_id: z.string().min(1),
    peer_id: z.string().min(1),
    peer_type: z.enum(["user", "chat", "channel"]),
    access_hash: z.string().nullable().optional(),
    text: z.string().min(1),
});
export async function handleSendMessage(fastify, request, reply) {
    try {
        const body = SendMessageRequestSchema.parse(request.body);
        await sendTelegramMessage(body.account_id, request.userId, body.peer_id, body.peer_type, body.text, body.access_hash);
        return { success: true };
    }
    catch (error) {
        if (error?.name === "ZodError") {
            return reply.status(400).send({ error: error.message });
        }
        fastify.log.error(`❌ Ошибка отправки Telegram сообщения: ${error}`);
        return reply.status(500).send({ error: "Failed to send Telegram message" });
    }
}
//# sourceMappingURL=send.js.map