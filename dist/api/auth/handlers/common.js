import jwt from "jsonwebtoken";
import { getUserById } from "../../../core/user-postgres.js";
import { deleteAllUserSessions } from "../../../core/session.js";
import { generateAccessToken, } from "../../../middleware/auth.js";
/**
 * GET /auth/me - получить текущего пользователя
 */
export async function handleGetMe(fastify, request, reply) {
    const user = await getUserById(request.userId);
    if (!user) {
        return reply.status(404).send({ error: "User not found" });
    }
    return {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
    };
}
/**
 * POST /auth/logout - выход
 */
export async function handleLogout(fastify, request, reply) {
    await deleteAllUserSessions(request.userId);
    return { success: true };
}
/**
 * POST /auth/refresh - обновление access token через refresh token
 */
export async function handleRefresh(fastify, request, reply) {
    const { refreshToken } = request.body;
    if (!refreshToken) {
        return reply.status(400).send({ error: "Refresh token required" });
    }
    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET || "dev-secret");
        const newAccessToken = generateAccessToken({
            userId: decoded.userId,
            email: decoded.email,
        });
        return {
            accessToken: newAccessToken,
        };
    }
    catch (error) {
        return reply.status(401).send({ error: "Invalid refresh token" });
    }
}
//# sourceMappingURL=common.js.map