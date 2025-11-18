import Redis from "ioredis";
let redis = null;
export function getRedisClient() {
    if (!redis) {
        redis = new Redis({
            host: process.env.REDIS_HOST || "localhost",
            port: Number(process.env.REDIS_PORT) || 6380,
        });
    }
    return redis;
}
//# sourceMappingURL=redis.js.map