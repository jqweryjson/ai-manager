import Fastify from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import "dotenv/config";
import { authRoutes } from "./api/auth.js";
import { ingestRoutes } from "./api/ingest.js";
import { chatRoutes } from "./api/chat.js";
import { workspaceRoutes } from "./api/workspace.js";
import { roleRoutes } from "./api/role.js";
import { telegramUserRoutes } from "./api/telegram-user.js";
import { authMiddleware } from "./middleware/auth.js";
import { initializeCollection } from "./core/milvus.js";

const isProd = process.env.NODE_ENV === "production";

const app = Fastify({
  logger: isProd
    ? true
    : {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "HH:MM:ss",
            ignore: "pid,hostname,time",
            singleLine: true,
            messageFormat: "{msg}",
          },
        },
      },
});

await app.register(cors, {
  origin: process.env.FRONTEND_URL || true,
  credentials: true,
  methods: ["GET", "POST", "DELETE", "PUT", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
});
await app.register(rateLimit, { max: 100, timeWindow: "1 minute" });

// Register auth middleware globally
app.decorate("authenticate", authMiddleware);

// Public routes
app.get("/health", async () => ({ status: "ok" }));

// Protected routes
await app.register(authRoutes, { prefix: "/api" });
await app.register(workspaceRoutes, { prefix: "/api" });
await app.register(roleRoutes, { prefix: "/api" });
await app.register(ingestRoutes, { prefix: "/api" });
await app.register(chatRoutes, { prefix: "/api" });
await app.register(telegramUserRoutes, { prefix: "/api" });

// Initialize Milvus collection on startup
try {
  app.log.info("🗄️  Инициализация Milvus коллекции...");
  await initializeCollection();
  app.log.info("✅ Milvus коллекция готова");
} catch (error) {
  app.log.error(`❌ Ошибка инициализации Milvus: ${error}`);
  process.exit(1);
}

const port = Number(process.env.BACKEND_PORT) || 4001;
try {
  await app.listen({ port, host: "0.0.0.0" });
  app.log.info(`Server started on :${port}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
