import { HttpError } from "./http-error.js";

// Small error catalog: one place for status codes and stable API codes.
export const unauthorized = (message = "Authentication required") =>
  new HttpError(401, "UNAUTHORIZED", message);

export const invalidCredentials = () =>
  new HttpError(401, "INVALID_CREDENTIALS", "Invalid email or password");

export const emailAlreadyExists = () =>
  new HttpError(409, "EMAIL_ALREADY_EXISTS", "Email is already registered");

export const itemNotFound = () =>
  new HttpError(404, "ITEM_NOT_FOUND", "Item not found");

export const insufficientStock = () =>
  new HttpError(409, "INSUFFICIENT_STOCK", "Insufficient stock");

export const validationError = (message: string) =>
  new HttpError(400, "VALIDATION_ERROR", message);
