export type ColumnId = "phone" | "company" | "website" | "city";
export type SortId = "nama-asc" | "nama-desc" | "perusahaan-asc" | "perusahaan-desc";
export type ViewMode = "tabel" | "kartu";

export const SORT_OPTIONS: { id: SortId; label: string }[] = [
  { id: "nama-asc", label: "Nama A–Z" },
  { id: "nama-desc", label: "Nama Z–A" },
  { id: "perusahaan-asc", label: "Perusahaan A–Z" },
  { id: "perusahaan-desc", label: "Perusahaan Z–A" },
];

export const ALL_COLUMNS: { id: ColumnId; label: string }[] = [
  { id: "phone", label: "Telepon" },
  { id: "company", label: "Perusahaan" },
  { id: "website", label: "Website" },
  { id: "city", label: "Kota" },
];
