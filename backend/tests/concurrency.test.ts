import type { Express } from "express";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "../src/lib/prisma.js";
import { createApp } from "../src/app.js";
import {
  bearer,
  createItemId,
  createUser,
  expectApiError,
  resetDatabase,
  type TestUser,
} from "./helpers.js";

let app: Express;
let user: TestUser;

beforeAll(async () => {
  app = createApp();
  user = await createUser(app, "concurrent");
});

afterAll(resetDatabase);

function reduceStock(itemId: number, quantity: number) {
  return request(app)
    .post(`/api/v1/items/${itemId}/reduce-stock`)
    .set(bearer(user.token))
    .send({ quantity });
}

describe("stock concurrency", () => {
  it("never oversells when 10 requests race for the same stock", async () => {
    const itemId = await createItemId(app, user.token, { stock: 50 });

    const responses = await Promise.all(
      Array.from({ length: 10 }, () => reduceStock(itemId, 10)),
    );

    const statuses = responses.map((response) => response.status);
    expect(statuses.filter((status) => status === 200)).toHaveLength(5);
    expect(statuses.filter((status) => status === 409)).toHaveLength(5);

    for (const response of responses) {
      if (response.status === 409) {
        expectApiError(response, 409, "INSUFFICIENT_STOCK");
      }
    }

    const item = await prisma.item.findUniqueOrThrow({ where: { id: itemId } });
    expect(item.stock).toBe(0);
    expect(item.stock).toBeGreaterThanOrEqual(0);
  });

  it("keeps the correct remainder when quantities do not divide evenly", async () => {
    const itemId = await createItemId(app, user.token, { stock: 5 });

    const responses = await Promise.all(
      Array.from({ length: 4 }, () => reduceStock(itemId, 2)),
    );

    expect(
      responses.filter((response) => response.status === 200),
    ).toHaveLength(2);
    expect(
      responses.filter((response) => response.status === 409),
    ).toHaveLength(2);

    const item = await prisma.item.findUniqueOrThrow({ where: { id: itemId } });
    expect(item.stock).toBe(1);
    expect(item.stock).toBeGreaterThanOrEqual(0);
  });

  it("rejects a reduction after stock reaches zero", async () => {
    const itemId = await createItemId(app, user.token, { stock: 3 });

    await reduceStock(itemId, 3).expect(200);

    const response = await reduceStock(itemId, 1);

    expectApiError(response, 409, "INSUFFICIENT_STOCK");

    const item = await prisma.item.findUniqueOrThrow({ where: { id: itemId } });
    expect(item.stock).toBe(0);
  });
});
