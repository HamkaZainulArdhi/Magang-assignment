import type { Request, Response } from "express";
import { bodyOf, paramsOf, queryOf } from "../lib/request.js";
import { sendSuccess } from "../lib/response.js";
import { requireAuth } from "../middlewares/auth.js";
import type {
  CreateItemInput,
  ItemIdParams,
  ListItemsQuery,
  ReduceStockInput,
  UpdateItemInput,
} from "../schemas/item.js";
import * as itemService from "../services/item.service.js";

export async function create(req: Request, res: Response) {
  const item = await itemService.createItem(
    requireAuth(req).id,
    bodyOf<CreateItemInput>(req),
  );

  return sendSuccess(res, "Barang berhasil ditambahkan", item, 201);
}

export async function list(req: Request, res: Response) {
  const { items, meta } = await itemService.listItems(
    requireAuth(req).id,
    queryOf<ListItemsQuery>(req),
  );

  return sendSuccess(res, "Daftar barang berhasil diambil", items, 200, meta);
}

export async function getById(req: Request, res: Response) {
  const { id: itemId } = paramsOf<ItemIdParams>(req);
  const item = await itemService.getItem(requireAuth(req).id, itemId);

  return sendSuccess(res, "Detail barang berhasil diambil", item);
}

export async function update(req: Request, res: Response) {
  const { id: itemId } = paramsOf<ItemIdParams>(req);
  const item = await itemService.updateItem(
    requireAuth(req).id,
    itemId,
    bodyOf<UpdateItemInput>(req),
  );

  return sendSuccess(res, "Barang berhasil diperbarui", item);
}

export async function remove(req: Request, res: Response) {
  const { id: itemId } = paramsOf<ItemIdParams>(req);
  await itemService.deleteItem(requireAuth(req).id, itemId);

  return sendSuccess(res, "Barang berhasil dihapus", { id: itemId });
}

export async function reduceStock(req: Request, res: Response) {
  const { id: itemId } = paramsOf<ItemIdParams>(req);
  const { quantity } = bodyOf<ReduceStockInput>(req);
  const item = await itemService.reduceStock(
    requireAuth(req).id,
    itemId,
    quantity,
  );

  return sendSuccess(res, "Stok barang berhasil dikurangi", item);
}
