import type { User } from "../types/auth.js";
export declare function findUserByEmail(email: string): Promise<User | null>;
export declare function createUser(userData: Omit<User, "id" | "createdAt">): Promise<User>;
export declare function getUserById(userId: string): Promise<User | null>;
export declare function findUserByTelegramId(telegramId: string): Promise<User | null>;
/**
 * Поиск пользователя по VK ID
 */
export declare function findUserByVkId(vkId: number): Promise<User | null>;
//# sourceMappingURL=user-postgres.d.ts.map