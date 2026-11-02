import { z } from "../lib/zod.js";

const email = z
  .string({ error: "Email wajib diisi" })
  .trim()
  .toLowerCase()
  .max(191, "Email maksimal 191 karakter")
  .email("Format email tidak valid");

const password = z
  .string({ error: "Kata sandi wajib diisi" })
  .min(8, "Kata sandi minimal 8 karakter")
  .max(72, "Kata sandi maksimal 72 karakter")
  .refine(
    (value) => Buffer.byteLength(value, "utf8") <= 72,
    "Kata sandi maksimal 72 byte",
  );

export const registerSchema = z
  .object({
    email,
    password,
    name: z
      .string({ error: "Nama harus berupa teks" })
      .trim()
      .min(1, "Nama tidak boleh kosong")
      .max(100, "Nama maksimal 100 karakter")
      .optional(),
  })
  .strict();

export const loginSchema = z
  .object({
    email,
    password,
  })
  .strict();

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
