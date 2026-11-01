import { components } from "./components.js";
import { paths } from "./paths.js";

export const openapi = {
  openapi: "3.0.3",
  info: {
    title: "Inventory Management API",
    version: "1.0.0",
    description:
      "Authenticated inventory API. Register or log in to obtain a JWT, then send it as `Authorization: Bearer <token>`. Items are always scoped to the authenticated user.",
  },
  servers: [{ url: "/api/v1", description: "API v1" }],
  tags: [
    { name: "Auth", description: "Registration and login" },
    { name: "Items", description: "Inventory item management" },
  ],
  components,
  paths,
};
