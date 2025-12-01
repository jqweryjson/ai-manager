import { FastifyInstance, FastifyReply } from "fastify";
import { AuthenticatedRequest } from "../../../middleware/auth.js";
import { sendTelegramMessage } from "../../../core/telegram-send.js";
import { z } from "zod";

const SendMessageRequestSchema = z.object({
  account_id: z.string().min(1),
  peer_id: z.string().min(1),
  peer_type: z.enum(["user", "chat", "channel"]),
  access_hash: z.string().nullable().optional(),
  text: z.string().min(1),
});

export async function handleSendMessage(
  fastify: FastifyInstance,
  request: AuthenticatedRequest,
  reply: FastifyReply
) {
  try {
    const body = SendMessageRequestSchema.parse(request.body);

    const result = await sendTelegramMessage(
      body.account_id,
      request.userId,
      body.peer_id,
      body.peer_type,
      body.text,
      body.access_hash
    );

    if (!result.success) {
      if (result.floodWaitSeconds) {
        return reply.status(429).send({
          error: "flood_wait",
          wait_seconds: result.floodWaitSeconds,
          message: `A wait of ${result.floodWaitSeconds} seconds is required`,
        });
      }
      return reply.status(500).send({
        error: result.error || "Failed to send Telegram message",
      });
    }

    return { success: true };
  } catch (error: any) {
    if (error?.name === "ZodError") {
      return reply.status(400).send({ error: error.message });
    }
    fastify.log.error(`❌ Ошибка отправки Telegram сообщения: ${error}`);
    return reply.status(500).send({ error: "Failed to send Telegram message" });
  }
}
