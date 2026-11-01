import type { RequestHandler } from "express";
import { sendError } from "../lib/response.js";

export const notFound: RequestHandler = (_req, res) => {
  sendError(res, 404, "Route not found", "ROUTE_NOT_FOUND");
};
