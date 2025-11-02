import { getRedisClient } from "./redis.js";
import type { User } from "../types/auth.js";

const SESSION_PREFIX = "session:";
const SESSION_TTL = 60 * 60 * 24 * 7; // 7 days

export async function createSession(
  userId: string,
  userData: Partial<User>
): Promise<string> {
  const redis = getRedisClient();
  const sessionId = `${userId}:${Date.now()}`;
  const sessionKey = `${SESSION_PREFIX}${sessionId}`;

  await redis.set(sessionKey, JSON.stringify(userData), "EX", SESSION_TTL);

  return sessionId;
}

export async function deleteAllUserSessions(userId: string): Promise<void> {
  const redis = getRedisClient();
  const pattern = `${SESSION_PREFIX}${userId}:*`;

  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}
