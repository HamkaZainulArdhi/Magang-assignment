import type { ColumnId, SortId, ViewMode } from "./columns.ts";
import type { User } from "@/types/user.ts";

export interface UserRow {
  user: User;
  company: string;
  city: string;
  siteHref: string;
  mapsHref: string;
}

export interface TableState {
  query: string;
  sort: SortId;
  cities: string[];
  visible: ColumnId[];
  view: ViewMode;
  page: number;
  pageSize: number;
  selectedIds: number[];
  selectedId: number | null;
}

export const initialTable: TableState = {
  query: "",
  sort: "nama-asc",
  cities: [],
  visible: ["phone", "company", "website", "city"],
  view: "tabel",
  page: 1,
  pageSize: 5,
  selectedIds: [],
  selectedId: null,
};
