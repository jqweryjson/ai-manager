import type { User } from "../types/auth.js";
export declare function createSession(userId: string, userData: Partial<User>): Promise<string>;
export declare function deleteAllUserSessions(userId: string): Promise<void>;
//# sourceMappingURL=session.d.ts.map