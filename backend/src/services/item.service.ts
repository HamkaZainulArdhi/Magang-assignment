import type { Item, Prisma } from "@prisma/client";
import { insufficientStock, itemNotFound } from "../lib/errors.js";
import { prisma } from "../lib/prisma.js";
import { prismaErrorCode } from "../lib/prisma-error.js";
import type { PaginationMeta } from "../lib/response.js";
import type {
  CreateItemInput,
  ListItemsQuery,
  UpdateItemInput,
} from "../schemas/item.js";

export interface ItemDto {
  id: number;
  name: string;
  description: string | null;
  stock: number;
  price: string;
  createdAt: string;
  updatedAt: string;
}

function toItemDto(item: Item): ItemDto {
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    stock: item.stock,
    // Decimal is exposed as a string so clients never lose precision.
    price: item.price.toFixed(2),
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

function toItemUpdateData(input: UpdateItemInput): Prisma.ItemUpdateInput {
  const data: Prisma.ItemUpdateInput = {};

  if (input.name !== undefined) data.name = input.name;
  if (input.description !== undefined) data.description = input.description;
  if (input.stock !== undefined) data.stock = input.stock;
  if (input.price !== undefined) data.price = input.price.toFixed(2);

  return data;
}

function findOwnedItem(userId: number, itemId: number): Promise<Item | null> {
  return prisma.item.findFirst({ where: { id: itemId, userId } });
}

export async function createItem(
  userId: number,
  input: CreateItemInput,
): Promise<ItemDto> {
  const item = await prisma.item.create({
    data: {
      userId,
      name: input.name,
      description: input.description ?? null,
      stock: input.stock,
      price: input.price.toFixed(2),
    },
  });

  return toItemDto(item);
}

export async function listItems(
  userId: number,
  query: ListItemsQuery,
): Promise<{ items: ItemDto[]; meta: PaginationMeta }> {
  const where = {
    userId,
    ...(query.search ? { name: { contains: query.search } } : {}),
  };

  const [items, total] = await prisma.$transaction([
    prisma.item.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.item.count({ where }),
  ]);

  return {
    items: items.map(toItemDto),
    meta: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / query.limit),
    },
  };
}

export async function getItem(
  userId: number,
  itemId: number,
): Promise<ItemDto> {
  const item = await findOwnedItem(userId, itemId);

  if (!item) throw itemNotFound();

  return toItemDto(item);
}

export async function updateItem(
  userId: number,
  itemId: number,
  input: UpdateItemInput,
): Promise<ItemDto> {
  try {
    const item = await prisma.item.update({
      where: { id: itemId, userId },
      data: toItemUpdateData(input),
    });

    return toItemDto(item);
  } catch (error) {
    if (prismaErrorCode(error) === "P2025") throw itemNotFound();
    throw error;
  }
}

export async function deleteItem(
  userId: number,
  itemId: number,
): Promise<void> {
  const { count } = await prisma.item.deleteMany({
    where: { id: itemId, userId },
  });

  if (count === 0) throw itemNotFound();
}

export async function reduceStock(
  userId: number,
  itemId: number,
  quantity: number,
): Promise<ItemDto> {
  // One conditional UPDATE: MySQL checks and decrements under a row lock, so
  // concurrent requests cannot both pass the stock check. No read-then-write.
  const { count } = await prisma.item.updateMany({
    where: { id: itemId, userId, stock: { gte: quantity } },
    data: { stock: { decrement: quantity } },
  });

  if (count === 0) {
    // The update failed. Distinguish "not yours/missing" from "not enough".
    const exists = await findOwnedItem(userId, itemId);
    if (!exists) throw itemNotFound();
    throw insufficientStock();
  }

  const item = await findOwnedItem(userId, itemId);
  if (!item) throw itemNotFound();

  return toItemDto(item);
}
