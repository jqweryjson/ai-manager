import { FastifyInstance } from "fastify";
import jwt from "jsonwebtoken";
import { getGoogleAuthUrl, getGoogleUserInfo } from "../core/google-oauth.js";
import {
  findUserByEmail,
  createUser,
  getUserById,
} from "../core/user-postgres.js";
import { createSession, deleteAllUserSessions } from "../core/session.js";
import {
  generateAccessToken,
  generateRefreshToken,
  authMiddleware,
  type AuthenticatedRequest,
} from "../middleware/auth.js";
import type { JWTPayload } from "../types/auth.js";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:8002";

export async function authRoutes(fastify: FastifyInstance) {
  // Google OAuth инициация
  fastify.get("/auth/google", async (request, reply) => {
    const authUrl = getGoogleAuthUrl();
    return reply.redirect(authUrl);
  });

  // Google OAuth callback
  fastify.get("/auth/callback", async (request, reply) => {
    const { code } = request.query as { code?: string };

    if (!code) {
      return reply.redirect(`${FRONTEND_URL}/auth?error=missing_code`);
    }

    try {
      const googleUser = await getGoogleUserInfo(code);

      let user = await findUserByEmail(googleUser.email);

      if (!user) {
        user = await createUser({
          email: googleUser.email,
          name: googleUser.name,
          picture: googleUser.picture,
          googleId: googleUser.id,
        });
      }

      const accessToken = generateAccessToken({
        userId: user.id,
        email: user.email,
      });

      const refreshToken = generateRefreshToken({
        userId: user.id,
        email: user.email,
      });

      await createSession(user.id, {
        email: user.email,
        name: user.name,
        picture: user.picture ?? "",
      });

      return reply.redirect(
        `${FRONTEND_URL}/app?token=${accessToken}&refresh=${refreshToken}`
      );
    } catch (error) {
      fastify.log.error(error);
      return reply.redirect(`${FRONTEND_URL}/auth?error=oauth_failed`);
    }
  });

  // Получить текущего пользователя
  fastify.get(
    "/auth/me",
    { preHandler: authMiddleware },
    async (request, reply) => {
      const req = request as AuthenticatedRequest;
      const user = await getUserById(req.userId);

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
  );

  // Выход
  fastify.post(
    "/auth/logout",
    { preHandler: authMiddleware },
    async (request, reply) => {
      const req = request as AuthenticatedRequest;
      await deleteAllUserSessions(req.userId);
      return { success: true };
    }
  );

  // Обновление access token через refresh token
  fastify.post("/auth/refresh", async (request, reply) => {
    const { refreshToken } = request.body as { refreshToken: string };

    if (!refreshToken) {
      return reply.status(400).send({ error: "Refresh token required" });
    }

    try {
      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_SECRET || "dev-secret"
      ) as JWTPayload;

      const newAccessToken = generateAccessToken({
        userId: decoded.userId,
        email: decoded.email,
      });

      return {
        accessToken: newAccessToken,
      };
    } catch (error) {
      return reply.status(401).send({ error: "Invalid refresh token" });
    }
  });
}
