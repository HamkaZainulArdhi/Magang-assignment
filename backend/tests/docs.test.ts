import type { Express } from "express";
import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { openapi } from "../src/docs/openapi.js";

let app: Express;

beforeAll(() => {
  app = createApp();
});

describe("Swagger documentation", () => {
  it("serves the Swagger UI", async () => {
    const response = await request(app).get("/api/docs/");

    expect(response.status).toBe(200);
    expect(response.type).toBe("text/html");
    expect(response.text).toContain('id="swagger-ui"');
    expect(response.text).toContain("Inventory API Docs");
  });

  it("serves the OpenAPI document as JSON", async () => {
    const response = await request(app).get("/api/docs.json");

    expect(response.status).toBe(200);
    expect(response.type).toBe("application/json");
    expect(response.body.openapi).toMatch(/^3\./);
    expect(response.body.info.title).toBe("Inventory Management API");
  });

  it("declares the bearer JWT security scheme", () => {
    expect(openapi.components.securitySchemes.bearerAuth).toEqual({
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT",
    });
  });

  it("documents every implemented path", () => {
    expect(Object.keys(openapi.paths).sort()).toEqual([
      "/auth/login",
      "/auth/register",
      "/items",
      "/items/{id}",
      "/items/{id}/reduce-stock",
    ]);
  });

  it("documents every implemented operation", () => {
    expect(openapi.paths).toMatchObject({
      "/auth/register": { post: expect.any(Object) },
      "/auth/login": { post: expect.any(Object) },
      "/items": {
        get: expect.any(Object),
        post: expect.any(Object),
      },
      "/items/{id}": {
        get: expect.any(Object),
        put: expect.any(Object),
        delete: expect.any(Object),
      },
      "/items/{id}/reduce-stock": { post: expect.any(Object) },
    });
  });

  it("marks every item operation as authenticated", () => {
    const itemOperations = [
      openapi.paths["/items"].get,
      openapi.paths["/items"].post,
      openapi.paths["/items/{id}"].get,
      openapi.paths["/items/{id}"].put,
      openapi.paths["/items/{id}"].delete,
      openapi.paths["/items/{id}/reduce-stock"].post,
    ];

    for (const operation of itemOperations) {
      expect(operation.security).toEqual([{ bearerAuth: [] }]);
    }
  });
});
