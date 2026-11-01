import { z } from "zod";

const name = z.string().trim().min(1).max(150);
const description = z.string().trim().max(5_000).nullable();
const stock = z.number().int().min(0).max(1_000_000_000);
const price = z.number().finite().min(0).max(9_999_999_999.99);

export const createItemSchema = z
  .object({
    name,
    description: description.optional(),
    stock,
    price,
  })
  .strict();

export const updateItemSchema = createItemSchema
  .partial()
  .refine(
    (value) => Object.keys(value).length > 0,
    "At least one field must be provided",
  );

export const itemIdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const listItemsQuerySchema = z.object({
  search: z.string().trim().max(150).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export const reduceStockSchema = z
  .object({
    quantity: z.number().int().positive().max(1_000_000_000),
  })
  .strict();

export type CreateItemInput = z.infer<typeof createItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;
export type ListItemsQuery = z.infer<typeof listItemsQuerySchema>;
export type ReduceStockInput = z.infer<typeof reduceStockSchema>;
export type ItemIdParams = z.infer<typeof itemIdParamsSchema>;
