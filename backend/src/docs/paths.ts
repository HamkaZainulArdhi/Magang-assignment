import { errorResponse, jsonBody, successResponse } from "./components.js";

const validationError = { $ref: "#/components/responses/ValidationError" };
const unauthorized = { $ref: "#/components/responses/Unauthorized" };
const notFound = { $ref: "#/components/responses/NotFound" };
const conflict = { $ref: "#/components/responses/Conflict" };

const itemIdParameter = {
  name: "id",
  in: "path",
  required: true,
  schema: { type: "integer", minimum: 1 },
};

export const paths = {
  "/auth/register": {
    post: {
      tags: ["Auth"],
      summary: "Register a new user",
      requestBody: jsonBody("RegisterRequest"),
      responses: {
        201: successResponse("RegisterResponse", "User registered."),
        400: validationError,
        409: errorResponse(
          "Email is already registered.",
          "EMAIL_ALREADY_EXISTS",
          "Email is already registered",
        ),
      },
    },
  },
  "/auth/login": {
    post: {
      tags: ["Auth"],
      summary: "Log in and obtain a JWT",
      requestBody: jsonBody("LoginRequest"),
      responses: {
        200: successResponse("LoginResponse", "Authenticated."),
        400: validationError,
        401: errorResponse(
          "Invalid email or password.",
          "INVALID_CREDENTIALS",
          "Invalid email or password",
        ),
      },
    },
  },
  "/items": {
    get: {
      tags: ["Items"],
      summary: "List the authenticated user's items",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "search",
          in: "query",
          schema: { type: "string", maxLength: 150 },
          description: "Case-insensitive partial match on item name.",
        },
        {
          name: "page",
          in: "query",
          schema: { type: "integer", minimum: 1, default: 1 },
        },
        {
          name: "limit",
          in: "query",
          schema: {
            type: "integer",
            minimum: 1,
            maximum: 100,
            default: 10,
          },
        },
      ],
      responses: {
        200: successResponse("ItemsResponse", "Items retrieved."),
        400: validationError,
        401: unauthorized,
      },
    },
    post: {
      tags: ["Items"],
      summary: "Create an item",
      security: [{ bearerAuth: [] }],
      requestBody: jsonBody("ItemInput"),
      responses: {
        201: successResponse("ItemResponse", "Item created."),
        400: validationError,
        401: unauthorized,
      },
    },
  },
  "/items/{id}": {
    parameters: [itemIdParameter],
    get: {
      tags: ["Items"],
      summary: "Get one item owned by the authenticated user",
      security: [{ bearerAuth: [] }],
      responses: {
        200: successResponse("ItemResponse", "Item retrieved."),
        400: validationError,
        401: unauthorized,
        404: notFound,
      },
    },
    put: {
      tags: ["Items"],
      summary: "Update an item owned by the authenticated user",
      security: [{ bearerAuth: [] }],
      requestBody: jsonBody("ItemUpdateInput"),
      responses: {
        200: successResponse("ItemResponse", "Item updated."),
        400: validationError,
        401: unauthorized,
        404: notFound,
      },
    },
    delete: {
      tags: ["Items"],
      summary: "Delete an item owned by the authenticated user",
      security: [{ bearerAuth: [] }],
      responses: {
        200: successResponse("DeleteResponse", "Item deleted."),
        400: validationError,
        401: unauthorized,
        404: notFound,
      },
    },
  },
  "/items/{id}/reduce-stock": {
    parameters: [itemIdParameter],
    post: {
      tags: ["Items"],
      summary: "Atomically reduce stock",
      description:
        "Runs a single conditional UPDATE (`stock = stock - quantity WHERE stock >= quantity`). Returns 409 when stock is insufficient; stock never becomes negative.",
      security: [{ bearerAuth: [] }],
      requestBody: jsonBody("ReduceStockRequest"),
      responses: {
        200: successResponse("ItemResponse", "Stock reduced."),
        400: validationError,
        401: unauthorized,
        404: notFound,
        409: conflict,
      },
    },
  },
};
