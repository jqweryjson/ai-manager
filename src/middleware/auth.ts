import jwt from "jsonwebtoken";
import { FastifyRequest, FastifyReply } from "fastify";
import type { JWTPayload } from "../types/auth.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

export interface AuthenticatedRequest extends FastifyRequest {
  userId: string;
  email: string;
}

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const token = request.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return reply.status(401).send({ error: "Missing token" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    const req = request as AuthenticatedRequest;
    req.userId = decoded.userId;
    req.email = decoded.email;
  } catch (err) {
    return reply.status(401).send({ error: "Invalid token" });
  }
}

export function generateAccessToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
}

export function generateRefreshToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}
