import { z } from "zod";

const email = z
  .string()
  .trim()
  .toLowerCase()
  .max(191)
  .email("Invalid email address");

// bcrypt only reads the first 72 bytes, so reject longer UTF-8 values instead
// of silently truncating them.
const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be at most 72 characters")
  .refine(
    (value) => Buffer.byteLength(value, "utf8") <= 72,
    "Password must be at most 72 bytes",
  );

export const registerSchema = z
  .object({
    email,
    password,
    name: z.string().trim().min(1).max(100).optional(),
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
