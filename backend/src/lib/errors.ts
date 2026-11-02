import { HttpError } from "./http-error.js";

// Small error catalog: one place for status codes and stable API codes.
// Codes stay in English for clients; messages are user-facing Indonesian.
export const unauthorized = (message = "Silakan masuk terlebih dahulu") =>
  new HttpError(401, "UNAUTHORIZED", message);

export const invalidCredentials = () =>
  new HttpError(401, "INVALID_CREDENTIALS", "Email atau kata sandi salah");

export const emailAlreadyExists = () =>
  new HttpError(409, "EMAIL_ALREADY_EXISTS", "Email ini sudah terdaftar");

export const itemNotFound = () =>
  new HttpError(404, "ITEM_NOT_FOUND", "Barang tidak ditemukan");

export const insufficientStock = () =>
  new HttpError(409, "INSUFFICIENT_STOCK", "Stok barang tidak mencukupi");

export const validationError = (message: string) =>
  new HttpError(400, "VALIDATION_ERROR", message);
