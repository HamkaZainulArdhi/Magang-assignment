import express from "express";
import docsRouter from "./docs/router.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { notFound } from "./middlewares/notFound.js";
import routes from "./routes/index.js";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(express.json({ limit: "100kb" }));

  app.use("/api", docsRouter);
  app.use("/api/v1", routes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
