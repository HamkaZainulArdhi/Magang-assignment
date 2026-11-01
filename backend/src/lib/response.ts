import type { Response } from "express";

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function sendSuccess<T>(
  res: Response,
  message: string,
  data: T,
  statusCode = 200,
  meta?: PaginationMeta,
) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    ...(meta ? { meta } : {}),
  });
}

export function sendError(
  res: Response,
  statusCode: number,
  message: string,
  code: string,
) {
  return res.status(statusCode).json({
    success: false,
    message,
    error: { code },
  });
}
