import { Router } from "express";
import swaggerUi from "swagger-ui-express";
import { openapi } from "./openapi.js";

const router = Router();

router.get("/docs.json", (_req, res) => {
  res.json(openapi);
});

router.use(
  "/docs",
  swaggerUi.serve,
  swaggerUi.setup(openapi, { customSiteTitle: "Inventory API Docs" }),
);

export default router;
