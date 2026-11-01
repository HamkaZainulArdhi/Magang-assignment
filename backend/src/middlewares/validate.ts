import type { RequestHandler } from "express";
import type { ZodType } from "zod";
import { validationError } from "../lib/errors.js";

interface ValidationSchemas {
  body?: ZodType;
  query?: ZodType;
  params?: ZodType;
}

function parse(schema: ZodType, value: unknown, target: string): unknown {
  const result = schema.safeParse(value);

  if (!result.success) {
    const detail = result.error.issues
      .map((issue) => `${issue.path.join(".") || target}: ${issue.message}`)
      .join("; ");
    throw validationError(detail);
  }

  return result.data;
}

export function validate(schemas: ValidationSchemas): RequestHandler {
  return (req, _res, next) => {
    try {
      req.validated = {
        body: schemas.body ? parse(schemas.body, req.body, "body") : undefined,
        query: schemas.query ? parse(schemas.query, req.query, "query") : undefined,
        params: schemas.params ? parse(schemas.params, req.params, "params") : undefined,
      };
      next();
    } catch (error) {
      next(error);
    }
  };
}
