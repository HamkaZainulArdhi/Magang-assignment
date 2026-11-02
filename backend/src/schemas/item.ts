import { z } from "../lib/zod.js";

const name = z
  .string({ error: "Nama barang harus berupa teks" })
  .trim()
  .min(1, "Nama barang tidak boleh kosong")
  .max(150, "Nama barang maksimal 150 karakter");

const description = z
  .string({ error: "Deskripsi harus berupa teks" })
  .trim()
  .max(5_000, "Deskripsi maksimal 5.000 karakter")
  .nullable();

const stock = z
  .number({ error: "Stok harus berupa angka" })
  .int("Stok harus berupa bilangan bulat")
  .min(0, "Stok tidak boleh negatif")
  .max(1_000_000_000, "Stok maksimal 1.000.000.000");

const price = z
  .number({ error: "Harga harus berupa angka" })
  .finite("Harga harus berupa angka yang valid")
  .min(0, "Harga tidak boleh negatif")
  .max(9_999_999_999.99, "Harga maksimal 9.999.999.999,99");

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
    "Minimal satu data harus diubah",
  );

export const itemIdParamsSchema = z.object({
  id: z.coerce
    .number({ error: "ID barang harus berupa angka" })
    .int("ID barang harus berupa bilangan bulat")
    .positive("ID barang harus lebih dari 0"),
});

export const listItemsQuerySchema = z.object({
  search: z
    .string({ error: "Pencarian harus berupa teks" })
    .trim()
    .max(150, "Pencarian maksimal 150 karakter")
    .optional(),
  page: z.coerce
    .number({ error: "Halaman harus berupa angka" })
    .int("Halaman harus berupa bilangan bulat")
    .min(1, "Halaman minimal 1")
    .default(1),
  limit: z.coerce
    .number({ error: "Limit harus berupa angka" })
    .int("Limit harus berupa bilangan bulat")
    .min(1, "Limit minimal 1")
    .max(100, "Limit maksimal 100")
    .default(10),
});

export const reduceStockSchema = z
  .object({
    quantity: z
      .number({ error: "Jumlah harus berupa angka" })
      .int("Jumlah harus berupa bilangan bulat")
      .positive("Jumlah minimal 1")
      .max(1_000_000_000, "Jumlah maksimal 1.000.000.000"),
  })
  .strict();

export type CreateItemInput = z.infer<typeof createItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;
export type ListItemsQuery = z.infer<typeof listItemsQuerySchema>;
export type ReduceStockInput = z.infer<typeof reduceStockSchema>;
export type ItemIdParams = z.infer<typeof itemIdParamsSchema>;
