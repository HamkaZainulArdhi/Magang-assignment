import type { User } from "@/types/user.ts";
import type { SortId } from "./columns.ts";
import type { UserRow } from "./types.ts";
import { getCity, getCompany, siteHref } from "../user-display.ts";

export const toRow = (user: User): UserRow => ({
  user,
  company: getCompany(user),
  city: getCity(user),
  siteHref: siteHref(user.website),
  mapsHref: `https://www.google.com/maps?q=${user.address.geo.lat},${user.address.geo.lng}`,
});

const sorters: Record<SortId, (a: UserRow, b: UserRow) => number> = {
  "nama-asc": (a, b) => a.user.name.localeCompare(b.user.name),
  "nama-desc": (a, b) => b.user.name.localeCompare(a.user.name),
  "perusahaan-asc": (a, b) => a.company.localeCompare(b.company),
  "perusahaan-desc": (a, b) => b.company.localeCompare(a.company),
};

export function filterRows(
  rows: UserRow[],
  opts: { q: string; cities: string[] },
): UserRow[] {
  return rows
    .filter((r) => opts.cities.length === 0 || opts.cities.includes(r.city))
    .filter(
      (r) =>
        !opts.q ||
        r.user.name.toLowerCase().includes(opts.q) ||
        r.user.email.toLowerCase().includes(opts.q),
    );
}

export function sortRows(rows: UserRow[], sort: SortId): UserRow[] {
  return [...rows].sort(sorters[sort]);
}

export function paginateRows(rows: UserRow[], page: number, pageSize: number): UserRow[] {
  return rows.slice((page - 1) * pageSize, page * pageSize);
}

export const totalPages = (count: number, pageSize: number): number =>
  Math.max(1, Math.ceil(count / pageSize));

// ponytail: clamp manual cukup untuk <100 halaman; lib pagination saat ellipsis kompleks.
export const clampPage = (p: number, pages: number): number =>
  Math.min(Math.max(1, p), pages);

export const toggleInList = <T,>(cur: T[], v: T): T[] =>
  cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v];
