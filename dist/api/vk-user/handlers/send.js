import { sendVkMessage } from "../../../core/vk-send.js";
import { SendMessageSchema } from "../schemas.js";
/**
 * POST /api/vk-user/send - отправка сообщения в VK
 */
export async function handleSendMessage(fastify, request, reply) {
    try {
        const body = SendMessageSchema.parse(request.body);
        const { account_id, peer_id, peer_type, text } = body;
        const result = await sendVkMessage(account_id, request.userId, peer_id, peer_type, text);
        if (!result.success) {
            if (result.rateLimitSeconds) {
                return reply.status(429).send({
                    error: "rate_limit",
                    wait_seconds: result.rateLimitSeconds,
                    message: `A wait of ${result.rateLimitSeconds} seconds is required`,
                });
            }
            return reply.status(500).send({
                error: result.error || "Failed to send VK message",
            });
        }
        return { success: true };
    }
    catch (error) {
        if (error?.name === "ZodError") {
            return reply.status(400).send({ error: error.message });
        }
        fastify.log.error(`❌ Ошибка отправки VK сообщения: ${error}`);
        return reply.status(500).send({ error: "Failed to send VK message" });
    }
}
//# sourceMappingURL=send.js.map