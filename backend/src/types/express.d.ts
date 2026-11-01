import type { AuthUser } from "./auth.js";

declare global {
  namespace Express {
    interface Request {
      auth?: AuthUser;
      validated?: {
        body: unknown;
        query: unknown;
        params: unknown;
      };
    }
  }
}
