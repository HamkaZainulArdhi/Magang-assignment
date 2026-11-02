import type { ErrorRequestHandler } from "express";
import { HttpError } from "../lib/http-error.js";
import { sendError } from "../lib/response.js";

export const errorHandler: ErrorRequestHandler = (error, _req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  if (error instanceof HttpError) {
    sendError(res, error.statusCode, error.message, error.code);
    return;
  }

  // body-parser raises a SyntaxError with status 400 for malformed JSON.
  if (error instanceof SyntaxError && (error as { status?: number }).status === 400) {
    sendError(res, 400, "Format data yang dikirim tidak valid", "INVALID_JSON");
    return;
  }

  console.error("[unhandled error]", error);
  sendError(res, 500, "Terjadi kesalahan pada server. Silakan coba lagi", "INTERNAL_ERROR");
};
