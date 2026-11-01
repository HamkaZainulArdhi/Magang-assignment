import type { Request, RequestHandler } from "express";
import { unauthorized } from "../lib/errors.js";
import { verifyAccessToken } from "../lib/token.js";
import type { AuthUser } from "../types/auth.js";

const BEARER_PREFIX = "Bearer ";

export function authenticate(): RequestHandler {
  return (req, _res, next) => {
    const header = req.headers.authorization;
    const token = header?.startsWith(BEARER_PREFIX)
      ? header.slice(BEARER_PREFIX.length).trim()
      : "";

    if (!token) {
      return next(unauthorized());
    }

    try {
      req.auth = verifyAccessToken(token);
      next();
    } catch {
      next(unauthorized("Invalid or expired token"));
    }
  };
}

// Controllers run behind authenticate(), so this only documents the invariant.
export function requireAuth(req: Request): AuthUser {
  if (!req.auth) throw unauthorized();
  return req.auth;
}
