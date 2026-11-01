import { Router } from "express";
import * as itemController from "../controllers/item.controller.js";
import { authenticate } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import {
  createItemSchema,
  itemIdParamsSchema,
  listItemsQuerySchema,
  reduceStockSchema,
  updateItemSchema,
} from "../schemas/item.js";

const router = Router();

router.use(authenticate());

router.post("/", validate({ body: createItemSchema }), itemController.create);
router.get("/", validate({ query: listItemsQuerySchema }), itemController.list);
router.get("/:id", validate({ params: itemIdParamsSchema }), itemController.getById);
router.put(
  "/:id",
  validate({ params: itemIdParamsSchema, body: updateItemSchema }),
  itemController.update,
);
router.delete(
  "/:id",
  validate({ params: itemIdParamsSchema }),
  itemController.remove,
);
router.post(
  "/:id/reduce-stock",
  validate({ params: itemIdParamsSchema, body: reduceStockSchema }),
  itemController.reduceStock,
);

export default router;
