import { FastifyInstance, FastifyReply } from "fastify";
import {
  getGoogleAuthUrl,
  getGoogleUserInfo,
} from "../../../core/google-oauth.js";
import { findUserByEmail, createUser } from "../../../core/user-postgres.js";
import { createSession } from "../../../core/session.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../../../middleware/auth.js";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:8002";

/**
 * GET /auth/google - инициация Google OAuth
 */
export async function handleGoogleAuth(
  fastify: FastifyInstance,
  request: any,
  reply: FastifyReply
) {
  const authUrl = getGoogleAuthUrl();
  return reply.redirect(authUrl);
}

/**
 * GET /auth/callback - Google OAuth callback
 */
export async function handleGoogleCallback(
  fastify: FastifyInstance,
  request: any,
  reply: FastifyReply
) {
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
}
