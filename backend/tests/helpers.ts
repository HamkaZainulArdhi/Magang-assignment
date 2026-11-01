import { randomUUID } from "node:crypto";
import type { Express } from "express";
import request from "supertest";
import { expect } from "vitest";
import { prisma } from "../src/lib/prisma.js";

export const PASSWORD = "password123";

export interface TestUser {
  id: number;
  email: string;
  password: string;
  token: string;
}

export interface ItemPayload {
  name: string;
  description?: string | null;
  stock: number;
  price: number;
}

interface ApiResponse {
  status: number;
  body: Record<string, unknown>;
}

export function bearer(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}

export async function createUser(
  app: Express,
  label = "user",
): Promise<TestUser> {
  const email = `${label}-${randomUUID()}@example.com`;

  const register = await request(app)
    .post("/api/v1/auth/register")
    .send({ email, password: PASSWORD, name: "Test User" });

  if (register.status !== 201) {
    throw new Error(
      `register failed with ${register.status}: ${JSON.stringify(register.body)}`,
    );
  }

  const login = await request(app)
    .post("/api/v1/auth/login")
    .send({ email, password: PASSWORD });

  if (login.status !== 200) {
    throw new Error(
      `login failed with ${login.status}: ${JSON.stringify(login.body)}`,
    );
  }

  return {
    id: register.body.data.user.id,
    email,
    password: PASSWORD,
    token: login.body.data.token,
  };
}

export async function resetDatabase(): Promise<void> {
  await prisma.$transaction([
    prisma.item.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}

export async function createItem(
  app: Express,
  token: string,
  overrides: Partial<ItemPayload> = {},
) {
  return request(app)
    .post("/api/v1/items")
    .set(bearer(token))
    .send({ name: "Test Item", stock: 10, price: 100, ...overrides });
}

export async function createItemId(
  app: Express,
  token: string,
  overrides: Partial<ItemPayload> = {},
): Promise<number> {
  const response = await createItem(app, token, overrides);
  const id: unknown = response.body?.data?.id;

  if (response.status !== 201 || typeof id !== "number") {
    throw new Error(
      `create item failed with ${response.status}: ${JSON.stringify(response.body)}`,
    );
  }

  return id;
}

export function expectApiError(
  response: ApiResponse,
  status: number,
  code: string,
): void {
  expect(response.status).toBe(status);
  expect(response.body).toMatchObject({
    success: false,
    error: { code },
  });
}
