const ref = (schema: string) => ({ $ref: `#/components/schemas/${schema}` });

function jsonResponse(description: string, schema: unknown, example?: unknown) {
  return {
    description,
    content: {
      "application/json": {
        schema,
        ...(example === undefined ? {} : { example }),
      },
    },
  };
}

export function successResponse(schema: string, description: string) {
  return jsonResponse(description, ref(schema));
}

export function errorResponse(
  description: string,
  code: string,
  message: string,
) {
  return jsonResponse(description, ref("ErrorResponse"), {
    success: false,
    message,
    error: { code },
  });
}

export function jsonBody(schema: string) {
  return {
    required: true,
    content: {
      "application/json": {
        schema: ref(schema),
      },
    },
  };
}

export const components = {
  securitySchemes: {
    bearerAuth: {
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT",
    },
  },
  schemas: {
    User: {
      type: "object",
      properties: {
        id: { type: "integer", example: 1 },
        email: { type: "string", format: "email", example: "user@example.com" },
        name: { type: "string", nullable: true, example: "Ada Lovelace" },
        createdAt: {
          type: "string",
          format: "date-time",
          example: "2026-01-01T10:00:00.000Z",
        },
      },
      required: ["id", "email", "name", "createdAt"],
    },
    RegisterRequest: {
      type: "object",
      additionalProperties: false,
      required: ["email", "password"],
      properties: {
        email: { type: "string", format: "email", example: "user@example.com" },
        password: {
          type: "string",
          format: "password",
          minLength: 8,
          maxLength: 72,
          example: "password123",
        },
        name: { type: "string", minLength: 1, maxLength: 100, example: "Ada Lovelace" },
      },
    },
    LoginRequest: {
      type: "object",
      additionalProperties: false,
      required: ["email", "password"],
      properties: {
        email: { type: "string", format: "email", example: "user@example.com" },
        password: { type: "string", format: "password", example: "password123" },
      },
    },
    Item: {
      type: "object",
      properties: {
        id: { type: "integer", example: 10 },
        name: { type: "string", example: "Mechanical Keyboard" },
        description: {
          type: "string",
          nullable: true,
          example: "Tenkeyless, brown switches",
        },
        stock: { type: "integer", minimum: 0, example: 25 },
        price: {
          type: "string",
          description: "Decimal string with two fraction digits.",
          example: "1500000.00",
        },
        createdAt: { type: "string", format: "date-time" },
        updatedAt: { type: "string", format: "date-time" },
      },
      required: [
        "id",
        "name",
        "description",
        "stock",
        "price",
        "createdAt",
        "updatedAt",
      ],
    },
    ItemInput: {
      type: "object",
      additionalProperties: false,
      required: ["name", "stock", "price"],
      properties: {
        name: { type: "string", minLength: 1, maxLength: 150 },
        description: {
          type: "string",
          maxLength: 5000,
          nullable: true,
          example: "Optional description",
        },
        stock: { type: "integer", minimum: 0, maximum: 1000000000, example: 25 },
        price: {
          type: "number",
          minimum: 0,
          maximum: 9999999999.99,
          example: 1500000,
        },
      },
    },
    ItemUpdateInput: {
      type: "object",
      additionalProperties: false,
      minProperties: 1,
      properties: {
        name: { type: "string", minLength: 1, maxLength: 150 },
        description: { type: "string", maxLength: 5000, nullable: true },
        stock: { type: "integer", minimum: 0, maximum: 1000000000 },
        price: { type: "number", minimum: 0, maximum: 9999999999.99 },
      },
    },
    ReduceStockRequest: {
      type: "object",
      additionalProperties: false,
      required: ["quantity"],
      properties: {
        quantity: {
          type: "integer",
          minimum: 1,
          maximum: 1000000000,
          example: 3,
        },
      },
    },
    Meta: {
      type: "object",
      properties: {
        page: { type: "integer", example: 1 },
        limit: { type: "integer", example: 10 },
        total: { type: "integer", example: 42 },
        totalPages: { type: "integer", example: 5 },
      },
      required: ["page", "limit", "total", "totalPages"],
    },
    ErrorResponse: {
      type: "object",
      properties: {
        success: { type: "boolean", enum: [false] },
        message: { type: "string", example: "Stok barang tidak mencukupi" },
        error: {
          type: "object",
          properties: {
            code: { type: "string", example: "INSUFFICIENT_STOCK" },
          },
          required: ["code"],
        },
      },
      required: ["success", "message", "error"],
    },
    RegisterResponse: {
      type: "object",
      properties: {
        success: { type: "boolean", enum: [true] },
        message: { type: "string", example: "Akun berhasil dibuat" },
        data: {
          type: "object",
          properties: { user: { $ref: "#/components/schemas/User" } },
          required: ["user"],
        },
      },
      required: ["success", "message", "data"],
    },
    LoginResponse: {
      type: "object",
      properties: {
        success: { type: "boolean", enum: [true] },
        message: { type: "string", example: "Berhasil masuk" },
        data: {
          type: "object",
          properties: {
            token: {
              type: "string",
              description: "JWT access token.",
              example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            },
            user: { $ref: "#/components/schemas/User" },
          },
          required: ["token", "user"],
        },
      },
      required: ["success", "message", "data"],
    },
    ItemResponse: {
      type: "object",
      properties: {
        success: { type: "boolean", enum: [true] },
        message: { type: "string", example: "Barang berhasil ditambahkan" },
        data: { $ref: "#/components/schemas/Item" },
      },
      required: ["success", "message", "data"],
    },
    ItemsResponse: {
      type: "object",
      properties: {
        success: { type: "boolean", enum: [true] },
        message: { type: "string", example: "Daftar barang berhasil diambil" },
        data: {
          type: "array",
          items: { $ref: "#/components/schemas/Item" },
        },
        meta: { $ref: "#/components/schemas/Meta" },
      },
      required: ["success", "message", "data", "meta"],
    },
    DeleteResponse: {
      type: "object",
      properties: {
        success: { type: "boolean", enum: [true] },
        message: { type: "string", example: "Barang berhasil dihapus" },
        data: {
          type: "object",
          properties: { id: { type: "integer", example: 10 } },
          required: ["id"],
        },
      },
      required: ["success", "message", "data"],
    },
  },
  responses: {
    ValidationError: errorResponse(
      "Invalid request input.",
      "VALIDATION_ERROR",
      "Nama barang tidak boleh kosong",
    ),
    Unauthorized: errorResponse(
      "Missing, invalid, or expired token.",
      "UNAUTHORIZED",
      "Silakan masuk terlebih dahulu",
    ),
    NotFound: errorResponse(
      "Resource not found.",
      "ITEM_NOT_FOUND",
      "Barang tidak ditemukan",
    ),
    Conflict: errorResponse(
      "Request conflicts with current state.",
      "INSUFFICIENT_STOCK",
      "Stok barang tidak mencukupi",
    ),
  },
};
