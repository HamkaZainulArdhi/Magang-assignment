import type { Request } from "express";

interface ValidatedInput {
  body: unknown;
  query: unknown;
  params: unknown;
}

function validatedInput(req: Request): ValidatedInput {
  if (!req.validated) {
    // Developer error: a route forgot validate() before its controller.
    throw new Error("validate() middleware must run before reading request input");
  }
  return req.validated;
}

export function bodyOf<T>(req: Request): T {
  return validatedInput(req).body as T;
}

export function queryOf<T>(req: Request): T {
  return validatedInput(req).query as T;
}

export function paramsOf<T>(req: Request): T {
  return validatedInput(req).params as T;
}
