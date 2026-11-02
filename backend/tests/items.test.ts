import type { Express } from "express";
import jwt from "jsonwebtoken";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";
import {
  bearer,
  createItem,
  createItemId,
  createUser,
  expectApiError,
  resetDatabase,
  type TestUser,
} from "./helpers.js";

let app: Express;
let owner: TestUser;
let other: TestUser;

beforeAll(async () => {
  app = createApp();
  owner = await createUser(app, "owner");
  other = await createUser(app, "other");
});

beforeEach(async () => {
  await prisma.item.deleteMany();
});

afterAll(resetDatabase);

describe("POST /api/v1/items", () => {
  it("creates an item for the authenticated user", async () => {
    const response = await createItem(app, owner.token, {
      name: "Mechanical Keyboard",
      description: "Tenkeyless, brown switches",
      stock: 25,
      price: 150000.5,
    });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      success: true,
      message: "Barang berhasil ditambahkan",
      data: {
        name: "Mechanical Keyboard",
        description: "Tenkeyless, brown switches",
        stock: 25,
        price: "150000.50",
      },
    });
    expect(response.body.data).not.toHaveProperty("userId");
    expect(response.body.data.id).toEqual(expect.any(Number));
  });

  it.each([
    [{ stock: -1 }, "negative stock"],
    [{ price: -1 }, "negative price"],
    [{ stock: 1.5 }, "fractional stock"],
    [{ name: "   " }, "blank name"],
  ])("rejects invalid payload: %s (%s)", async (overrides) => {
    const response = await createItem(app, owner.token, overrides);

    expectApiError(response, 400, "VALIDATION_ERROR");
  });

  it("rejects unknown fields", async () => {
    const response = await request(app)
      .post("/api/v1/items")
      .set(bearer(owner.token))
      .send({ name: "Valid", stock: 1, price: 1, userId: 999 });

    expectApiError(response, 400, "VALIDATION_ERROR");
    expect(response.body.message).toBe("Field tidak dikenal: userId");
  });

  it("rejects a payload without price", async () => {
    const response = await request(app)
      .post("/api/v1/items")
      .set(bearer(owner.token))
      .send({ name: "No price", stock: 1 });

    expectApiError(response, 400, "VALIDATION_ERROR");
    expect(response.body.message).toBe("Harga harus berupa angka");
  });

  it("requires authentication", async () => {
    const response = await request(app)
      .post("/api/v1/items")
      .send({ name: "Keyboard", stock: 1, price: 10 });

    expectApiError(response, 401, "UNAUTHORIZED");
  });
});

describe("authentication middleware", () => {
  it("rejects a malformed token", async () => {
    const response = await request(app)
      .get("/api/v1/items")
      .set("Authorization", "Bearer not-a-jwt");

    expectApiError(response, 401, "UNAUTHORIZED");
  });

  it("rejects an expired token", async () => {
    const token = jwt.sign(
      { email: owner.email },
      process.env.JWT_SECRET as string,
      { subject: String(owner.id), issuer: "inventory-api", expiresIn: -1 },
    );

    const response = await request(app)
      .get("/api/v1/items")
      .set("Authorization", `Bearer ${token}`);

    expectApiError(response, 401, "UNAUTHORIZED");
  });

  it("rejects a missing token on every item route", async () => {
    const responses = await Promise.all([
      request(app).get("/api/v1/items"),
      request(app).get("/api/v1/items/1"),
      request(app).put("/api/v1/items/1").send({ name: "x" }),
      request(app).delete("/api/v1/items/1"),
      request(app).post("/api/v1/items/1/reduce-stock").send({ quantity: 1 }),
    ]);

    for (const response of responses) {
      expectApiError(response, 401, "UNAUTHORIZED");
    }
  });

  it("returns a consistent 404 envelope for unknown routes", async () => {
    const response = await request(app).get("/api/v1/unknown");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      message: "Endpoint tidak ditemukan",
      error: { code: "ROUTE_NOT_FOUND" },
    });
  });
});

describe("GET /api/v1/items", () => {
  it("only lists items owned by the authenticated user", async () => {
    await createItem(app, owner.token, { name: "Keyboard", stock: 5 });
    await createItem(app, owner.token, { name: "Mouse", stock: 5 });
    await createItem(app, other.token, { name: "Secret", stock: 5 });

    const response = await request(app)
      .get("/api/v1/items")
      .set(bearer(owner.token));

    expect(response.status).toBe(200);
    expect(
      response.body.data.map((item: { name: string }) => item.name).sort(),
    ).toEqual(["Keyboard", "Mouse"]);
    expect(response.body.meta).toEqual({
      page: 1,
      limit: 10,
      total: 2,
      totalPages: 1,
    });
  });

  it("searches by name case-insensitively", async () => {
    await createItem(app, owner.token, { name: "Mechanical Keyboard" });
    await createItem(app, owner.token, { name: "Mousepad" });
    await createItem(app, owner.token, { name: "USB CABLE" });

    const keyboard = await request(app)
      .get("/api/v1/items?search=keyb")
      .set(bearer(owner.token));
    const cable = await request(app)
      .get("/api/v1/items?search=cable")
      .set(bearer(owner.token));

    expect(keyboard.status).toBe(200);
    expect(keyboard.body.data).toHaveLength(1);
    expect(keyboard.body.data[0].name).toBe("Mechanical Keyboard");

    expect(cable.status).toBe(200);
    expect(cable.body.data).toHaveLength(1);
    expect(cable.body.data[0].name).toBe("USB CABLE");
  });

  it("paginates with defaults and enforces the maximum limit", async () => {
    for (let index = 1; index <= 12; index += 1) {
      await createItem(app, owner.token, {
        name: `Item ${String(index).padStart(2, "0")}`,
      });
    }

    const defaults = await request(app)
      .get("/api/v1/items")
      .set(bearer(owner.token));
    expect(defaults.body.data).toHaveLength(10);
    expect(defaults.body.meta).toEqual({
      page: 1,
      limit: 10,
      total: 12,
      totalPages: 2,
    });

    const thirdPage = await request(app)
      .get("/api/v1/items?page=3&limit=5")
      .set(bearer(owner.token));
    expect(thirdPage.body.data).toHaveLength(2);
    expect(thirdPage.body.meta).toEqual({
      page: 3,
      limit: 5,
      total: 12,
      totalPages: 3,
    });

    const tooLarge = await request(app)
      .get("/api/v1/items?limit=101")
      .set(bearer(owner.token));
    expectApiError(tooLarge, 400, "VALIDATION_ERROR");

    const invalidPage = await request(app)
      .get("/api/v1/items?page=0")
      .set(bearer(owner.token));
    expectApiError(invalidPage, 400, "VALIDATION_ERROR");
  });
});

describe("GET /api/v1/items/:id", () => {
  it("returns an item owned by the user", async () => {
    const itemId = await createItemId(app, owner.token, { name: "Keyboard" });

    const response = await request(app)
      .get(`/api/v1/items/${itemId}`)
      .set(bearer(owner.token));

    expect(response.status).toBe(200);
    expect(response.body.data.name).toBe("Keyboard");
  });

  it("returns 404 for another user's item", async () => {
    const itemId = await createItemId(app, other.token, { name: "Private" });

    const response = await request(app)
      .get(`/api/v1/items/${itemId}`)
      .set(bearer(owner.token));

    expectApiError(response, 404, "ITEM_NOT_FOUND");
  });

  it("returns 404 for a missing item and 400 for a non-numeric id", async () => {
    const missing = await request(app)
      .get("/api/v1/items/999999")
      .set(bearer(owner.token));
    const invalid = await request(app)
      .get("/api/v1/items/abc")
      .set(bearer(owner.token));

    expectApiError(missing, 404, "ITEM_NOT_FOUND");
    expectApiError(invalid, 400, "VALIDATION_ERROR");
  });
});

describe("PUT /api/v1/items/:id", () => {
  it("updates fields of an owned item", async () => {
    const itemId = await createItemId(app, owner.token, { name: "Keyboard" });

    const response = await request(app)
      .put(`/api/v1/items/${itemId}`)
      .set(bearer(owner.token))
      .send({ name: "Updated Keyboard", stock: 7, description: null });

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      name: "Updated Keyboard",
      stock: 7,
      description: null,
    });
  });

  it("rejects an empty update payload", async () => {
    const itemId = await createItemId(app, owner.token);

    const response = await request(app)
      .put(`/api/v1/items/${itemId}`)
      .set(bearer(owner.token))
      .send({});

    expectApiError(response, 400, "VALIDATION_ERROR");
  });

  it("rejects a negative stock update", async () => {
    const itemId = await createItemId(app, owner.token);

    const response = await request(app)
      .put(`/api/v1/items/${itemId}`)
      .set(bearer(owner.token))
      .send({ stock: -5 });

    expectApiError(response, 400, "VALIDATION_ERROR");
  });

  it("cannot update another user's item", async () => {
    const itemId = await createItemId(app, other.token, { name: "Private" });

    const response = await request(app)
      .put(`/api/v1/items/${itemId}`)
      .set(bearer(owner.token))
      .send({ name: "Hijacked" });

    expectApiError(response, 404, "ITEM_NOT_FOUND");
  });
});

describe("DELETE /api/v1/items/:id", () => {
  it("deletes an owned item", async () => {
    const itemId = await createItemId(app, owner.token);

    const response = await request(app)
      .delete(`/api/v1/items/${itemId}`)
      .set(bearer(owner.token));

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      data: { id: itemId },
    });

    const afterDelete = await request(app)
      .get(`/api/v1/items/${itemId}`)
      .set(bearer(owner.token));
    expectApiError(afterDelete, 404, "ITEM_NOT_FOUND");
  });

  it("cannot delete another user's item", async () => {
    const itemId = await createItemId(app, other.token, { name: "Private" });

    const response = await request(app)
      .delete(`/api/v1/items/${itemId}`)
      .set(bearer(owner.token));

    expectApiError(response, 404, "ITEM_NOT_FOUND");

    const stillThere = await request(app)
      .get(`/api/v1/items/${itemId}`)
      .set(bearer(other.token));
    expect(stillThere.status).toBe(200);
  });
});

describe("POST /api/v1/items/:id/reduce-stock", () => {
  it("reduces stock atomically and returns the updated item", async () => {
    const itemId = await createItemId(app, owner.token, { stock: 10 });

    const response = await request(app)
      .post(`/api/v1/items/${itemId}/reduce-stock`)
      .set(bearer(owner.token))
      .send({ quantity: 4 });

    expect(response.status).toBe(200);
    expect(response.body.data.stock).toBe(6);
    expect(response.body.message).toBe("Stok barang berhasil dikurangi");
  });

  it("returns 409 without changing stock when stock is insufficient", async () => {
    const itemId = await createItemId(app, owner.token, { stock: 10 });

    const failed = await request(app)
      .post(`/api/v1/items/${itemId}/reduce-stock`)
      .set(bearer(owner.token))
      .send({ quantity: 11 });

    expectApiError(failed, 409, "INSUFFICIENT_STOCK");
    expect(failed.body.message).toBe("Stok barang tidak mencukupi");

    const afterFailure = await request(app)
      .get(`/api/v1/items/${itemId}`)
      .set(bearer(owner.token));
    expect(afterFailure.body.data.stock).toBe(10);
  });

  it("allows reducing exactly the remaining stock and then rejects more", async () => {
    const itemId = await createItemId(app, owner.token, { stock: 6 });

    const exact = await request(app)
      .post(`/api/v1/items/${itemId}/reduce-stock`)
      .set(bearer(owner.token))
      .send({ quantity: 6 });
    expect(exact.status).toBe(200);
    expect(exact.body.data.stock).toBe(0);

    const overflow = await request(app)
      .post(`/api/v1/items/${itemId}/reduce-stock`)
      .set(bearer(owner.token))
      .send({ quantity: 1 });
    expectApiError(overflow, 409, "INSUFFICIENT_STOCK");
  });

  it.each([0, -3, 1.5])("rejects an invalid quantity: %s", async (quantity) => {
    const itemId = await createItemId(app, owner.token);

    const response = await request(app)
      .post(`/api/v1/items/${itemId}/reduce-stock`)
      .set(bearer(owner.token))
      .send({ quantity });

    expectApiError(response, 400, "VALIDATION_ERROR");
  });

  it("returns 404 for another user's item and for a missing item", async () => {
    const itemId = await createItemId(app, other.token, { stock: 50 });

    const crossUser = await request(app)
      .post(`/api/v1/items/${itemId}/reduce-stock`)
      .set(bearer(owner.token))
      .send({ quantity: 1 });
    const missing = await request(app)
      .post("/api/v1/items/999999/reduce-stock")
      .set(bearer(owner.token))
      .send({ quantity: 1 });

    expectApiError(crossUser, 404, "ITEM_NOT_FOUND");
    expectApiError(missing, 404, "ITEM_NOT_FOUND");
  });
});
