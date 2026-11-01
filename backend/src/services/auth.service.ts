import type { Prisma } from "@prisma/client";
import bcrypt from "bcrypt";
import { env } from "../config/env.js";
import { emailAlreadyExists, invalidCredentials } from "../lib/errors.js";
import { prisma } from "../lib/prisma.js";
import { prismaErrorCode } from "../lib/prisma-error.js";
import { signAccessToken } from "../lib/token.js";
import type { LoginInput, RegisterInput } from "../schemas/auth.js";

// Compared against when the email does not exist, so login timing does not
// reveal whether an account is registered.
const DUMMY_PASSWORD_HASH =
  "$2b$10$aj/Ra/H4WVxSSt3yY81QkOHFmngfVOOZSuhXvruNvkqddtFFoKIJe";

const publicUserSelect = {
  id: true,
  email: true,
  name: true,
  createdAt: true,
} as const satisfies Prisma.UserSelect;

type PublicUserRow = Prisma.UserGetPayload<{
  select: typeof publicUserSelect;
}>;

export interface PublicUser {
  id: number;
  email: string;
  name: string | null;
  createdAt: string;
}

function toPublicUser(user: PublicUserRow): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt.toISOString(),
  };
}

export async function register(input: RegisterInput): Promise<PublicUser> {
  const password = await bcrypt.hash(input.password, env.BCRYPT_ROUNDS);

  try {
    const user = await prisma.user.create({
      data: {
        email: input.email,
        password,
        name: input.name ?? null,
      },
      select: publicUserSelect,
    });

    return toPublicUser(user);
  } catch (error) {
    if (prismaErrorCode(error) === "P2002") throw emailAlreadyExists();
    throw error;
  }
}

export async function login(
  input: LoginInput,
): Promise<{ token: string; user: PublicUser }> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: { ...publicUserSelect, password: true },
  });

  const passwordMatches = await bcrypt.compare(
    input.password,
    user?.password ?? DUMMY_PASSWORD_HASH,
  );

  if (!user || !passwordMatches) throw invalidCredentials();

  return {
    token: signAccessToken({ id: user.id, email: user.email }),
    user: toPublicUser(user),
  };
}
