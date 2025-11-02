import type { User } from "../types/auth.js";
import { getRedisClient } from "./redis.js";

const USER_PREFIX = "user:";
const EMAIL_INDEX_PREFIX = "email_index:";

export async function findUserByEmail(email: string): Promise<User | null> {
  const redis = getRedisClient();

  // Используем индекс email → userId
  const userId = await redis.get(`${EMAIL_INDEX_PREFIX}${email}`);

  if (!userId) {
    return null;
  }

  const userData = await redis.get(`${USER_PREFIX}${userId}`);
  return userData ? JSON.parse(userData) : null;
}

export async function createUser(
  userData: Omit<User, "id" | "createdAt">
): Promise<User> {
  const redis = getRedisClient();
  const userId = `user_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  const user: User = {
    id: userId,
    ...userData,
    createdAt: new Date(),
  };

  // Сохраняем пользователя и индекс email → userId
  await redis.set(`${USER_PREFIX}${userId}`, JSON.stringify(user));
  await redis.set(`${EMAIL_INDEX_PREFIX}${userData.email}`, userId);

  return user;
}

export async function getUserById(userId: string): Promise<User | null> {
  const redis = getRedisClient();
  const userData = await redis.get(`${USER_PREFIX}${userId}`);

  if (!userData) return null;

  return JSON.parse(userData);
}
