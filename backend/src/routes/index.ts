import { Router } from "express";
import authRoutes from "./auth.routes.js";
import itemRoutes from "./item.routes.js";

const routes = Router();

routes.use("/auth", authRoutes);
routes.use("/items", itemRoutes);

export default routes;
