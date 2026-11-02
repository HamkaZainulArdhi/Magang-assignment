import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import {
  PASSWORD,
  createUser,
  expectApiError,
  resetDatabase,
} from "./helpers.js";

const app = createApp();

beforeEach(resetDatabase);

describe("POST /api/v1/auth/register", () => {
  it("registers a user and never returns the password hash", async () => {
    const email = "register@example.com";

    const response = await request(app)
      .post("/api/v1/auth/register")
      .send({ email, password: PASSWORD, name: "Register User" });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      success: true,
      message: "Akun berhasil dibuat",
      data: { user: { email, name: "Register User" } },
    });
    expect(response.body.data.user).not.toHaveProperty("password");
    expect(response.body.data.user).not.toHaveProperty("passwordHash");
  });

  it("normalizes the email to lowercase and trims it", async () => {
    const response = await request(app)
      .post("/api/v1/auth/register")
      .send({ email: "  MixedCase@Example.COM  ", password: PASSWORD });

    expect(response.status).toBe(201);
    expect(response.body.data.user.email).toBe("mixedcase@example.com");
  });

  it("rejects a duplicate email with 409", async () => {
    const email = "duplicate@example.com";

    await request(app)
      .post("/api/v1/auth/register")
      .send({ email, password: PASSWORD })
      .expect(201);

    const response = await request(app)
      .post("/api/v1/auth/register")
      .send({ email, password: PASSWORD });

    expectApiError(response, 409, "EMAIL_ALREADY_EXISTS");
    expect(response.body.message).toBe("Email ini sudah terdaftar");
  });

  it.each([
    [{ email: "not-an-email", password: PASSWORD }, "invalid email"],
    [{ email: "short@example.com", password: "short" }, "short password"],
    [{ email: "missing@example.com" }, "missing password"],
    [
      { email: "extra@example.com", password: PASSWORD, role: "admin" },
      "unknown field",
    ],
    [
      { email: "bytes@example.com", password: "é".repeat(40) },
      "password over 72 bytes",
    ],
  ])("rejects invalid input: %s (%s)", async (payload) => {
    const response = await request(app)
      .post("/api/v1/auth/register")
      .send(payload);

    expectApiError(response, 400, "VALIDATION_ERROR");
  });

  it("rejects malformed JSON with 400", async () => {
    const response = await request(app)
      .post("/api/v1/auth/register")
      .set("Content-Type", "application/json")
      .send('{"email":');

    expectApiError(response, 400, "INVALID_JSON");
    expect(response.body.message).toBe("Format data yang dikirim tidak valid");
  });
});

describe("POST /api/v1/auth/login", () => {
  it("logs in with valid credentials and returns a JWT", async () => {
    const user = await createUser(app, "login");

    const response = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: user.email, password: user.password });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      message: "Berhasil masuk",
      data: { user: { id: user.id, email: user.email } },
    });
    expect(typeof response.body.data.token).toBe("string");
    expect(response.body.data.token.split(".")).toHaveLength(3);
    expect(response.body.data.user).not.toHaveProperty("password");
  });

  it("rejects a wrong password with 401", async () => {
    const user = await createUser(app, "wrong-password");

    const response = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: user.email, password: "wrong-password" });

    expectApiError(response, 401, "INVALID_CREDENTIALS");
    expect(response.body.message).toBe("Email atau kata sandi salah");
  });

  it("returns the same 401 for an unknown email", async () => {
    const response = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "nobody@example.com", password: PASSWORD });

    expectApiError(response, 401, "INVALID_CREDENTIALS");
    expect(response.body.message).toBe("Email atau kata sandi salah");
  });
});
