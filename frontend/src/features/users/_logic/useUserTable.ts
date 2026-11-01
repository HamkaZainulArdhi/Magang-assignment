import { useDeferredValue, useMemo, useState } from "react";
import { useUsers } from "@/hooks/useUsers.ts";
import { cityOptions } from "../user-display.ts";
import type { ColumnId, SortId, ViewMode } from "./columns.ts";
import {
  clampPage,
  filterRows,
  paginateRows,
  sortRows,
  toRow,
  toggleInList,
  totalPages,
} from "./table.ts";
import { initialTable } from "./types.ts";

export function useUserTable() {
  const remote = useUsers();
  const [query, setQuery] = useState(initialTable.query);
  const [sort, setSort] = useState<SortId>(initialTable.sort);
  const [cities, setCities] = useState<string[]>(initialTable.cities);
  const [visible, setVisible] = useState<ColumnId[]>(initialTable.visible);
  const [view, setView] = useState<ViewMode>(initialTable.view);
  const [page, setPage] = useState(initialTable.page);
  const [pageSize, setPageSize] = useState(initialTable.pageSize);
  const [selectedIds, setSelectedIds] = useState<number[]>(initialTable.selectedIds);
  const [selectedId, setSelectedId] = useState<number | null>(initialTable.selectedId);

  const q = useDeferredValue(query).trim().toLowerCase();
  const resetPage = () => setPage(1);
  const set = <K extends "query" | "sort">(
    key: K,
    v: K extends "query" ? string : SortId,
  ) => {
    ({ query: setQuery, sort: setSort })[key](v as never);
    resetPage();
  };

  const rows = useMemo(() => (remote.users ?? []).map(toRow), [remote.users]);
  const filtered = useMemo(
    () => sortRows(filterRows(rows, { q, cities }), sort),
    [rows, q, cities, sort],
  );
  const pages = totalPages(filtered.length, pageSize);
  const safePage = clampPage(page, pages);
  const pageItems = paginateRows(filtered, safePage, pageSize);
  const selected = rows.find((r) => r.user.id === selectedId) ?? null;

  return {
    ...remote,
    query, sort, cities, visible, view, page: safePage, pageSize,
    selectedIds, selected, filtered, pageItems,
    total: filtered.length, totalPages: pages,
    allCities: useMemo(
      () => (remote.users ? cityOptions(remote.users) : []),
      [remote.users],
    ),
    set, setCities, setVisible, setView, setPageSize, setSelectedIds,
    setSelectedId,
    goPage: (p: number) => setPage(clampPage(p, pages)),
    toggleSelect: (id: number) => setSelectedIds((cur) => toggleInList(cur, id)),
    toggleAll: () =>
      setSelectedIds((cur) => {
        const ids = pageItems.map((r) => r.user.id);
        return ids.every((id) => cur.includes(id))
          ? cur.filter((id) => !ids.includes(id))
          : [...new Set([...cur, ...ids])];
      }),
    toggleCity: (c: string) => {
      setCities((cur) => toggleInList(cur, c));
      resetPage();
    },
    toggleColumn: (c: ColumnId) => {
      // cavemann: toggle pola cur helper di hooks lain.
      setVisible((cur) => toggleInList(cur, c));
    },
    clearAll: () => {
      setQuery(""); setCities([]); resetPage();
    },
  };
}
