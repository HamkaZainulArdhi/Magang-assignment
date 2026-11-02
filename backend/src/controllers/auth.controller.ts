import type { Request, Response } from "express";
import { bodyOf } from "../lib/request.js";
import { sendSuccess } from "../lib/response.js";
import type { LoginInput, RegisterInput } from "../schemas/auth.js";
import * as authService from "../services/auth.service.js";

export async function register(req: Request, res: Response) {
  const user = await authService.register(bodyOf<RegisterInput>(req));

  return sendSuccess(res, "Akun berhasil dibuat", { user }, 201);
}

export async function login(req: Request, res: Response) {
  const result = await authService.login(bodyOf<LoginInput>(req));

  return sendSuccess(res, "Berhasil masuk", result);
}
