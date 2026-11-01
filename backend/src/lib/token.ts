import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env.js";
import type { AuthUser } from "../types/auth.js";

const ISSUER = "inventory-api";

export function signAccessToken(user: AuthUser): string {
  return jwt.sign({ email: user.email }, env.JWT_SECRET, {
    subject: String(user.id),
    issuer: ISSUER,
    expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
  });
}

export function verifyAccessToken(token: string): AuthUser {
  const payload = jwt.verify(token, env.JWT_SECRET, { issuer: ISSUER });

  if (typeof payload === "string" || !payload.sub) {
    throw new Error("Invalid token payload");
  }

  const id = Number(payload.sub);
  const email: unknown = payload.email;

  if (!Number.isInteger(id) || id <= 0 || typeof email !== "string") {
    throw new Error("Invalid token payload");
  }

  return { id, email };
}
