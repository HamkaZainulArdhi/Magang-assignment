import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import { validate } from "../middlewares/validate.js";
import { loginSchema, registerSchema } from "../schemas/auth.js";

const router = Router();

router.post("/register", validate({ body: registerSchema }), authController.register);
router.post("/login", validate({ body: loginSchema }), authController.login);

export default router;
