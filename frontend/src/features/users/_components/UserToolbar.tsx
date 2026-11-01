import { Icon } from "@/components/ui/Icon.tsx";
import { CheckItem, Menu, MenuOption, MenuTitle } from "@/components/ui/Menu.tsx";
import { ALL_COLUMNS, SORT_OPTIONS, type ColumnId, type SortId, type ViewMode } from "../_logic/columns.ts";

export type { SortId, ViewMode };

interface ToolbarProps {
  query: string;
  onQuery: (v: string) => void;
  sort: SortId;
  onSort: (s: SortId) => void;
  cities: string[];
  activeCities: string[];
  onToggleCity: (c: string) => void;
  onClearCities: () => void;
  visible: ColumnId[];
  onToggleColumn: (c: ColumnId) => void;
  view: ViewMode;
  onView: (v: ViewMode) => void;
}

export function UserToolbar(p: ToolbarProps) {
  const sortLabel = SORT_OPTIONS.find((o) => o.id === p.sort)?.label;

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <div className="relative min-w-52 flex-1 sm:max-w-64">
        <label htmlFor="cari-pengguna" className="sr-only">
          Cari pengguna berdasarkan nama atau email
        </label>
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-zinc-500">
          <Icon name="search" className="h-4 w-4" />
        </span>
        <input
          id="cari-pengguna"
          type="search"
          value={p.query}
          onChange={(e) => p.onQuery(e.target.value)}
          placeholder="Cari Pengguna…"
          autoComplete="off"
          className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pr-3 pl-9 text-sm text-zinc-100 placeholder:text-zinc-500 transition hover:border-white/20 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 focus:outline-none"
        />
      </div>

      <Menu label={sortLabel ?? "Urut"} icon="sort">
        {(close) => SORT_OPTIONS.map((o) => (
          <MenuOption key={o.id} active={p.sort === o.id} onPick={() => { p.onSort(o.id); close(); }}>
            {o.label}
          </MenuOption>
        ))}
      </Menu>

      <div className="ml-auto flex items-center gap-2.5">
        <div role="group" aria-label="Mode tampilan" className="inline-flex rounded-lg border border-white/10 bg-white/5 p-0.5">
          {(["tabel", "kartu"] as ViewMode[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => p.onView(v)}
              aria-pressed={p.view === v}
              title={v === "tabel" ? "Tampilan tabel" : "Tampilan kartu"}
              className={`rounded-md p-2 transition focus-visible:outline-2 focus-visible:outline-blue-500 ${p.view === v ? "bg-white/10 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
            >
              <Icon name={v === "tabel" ? "table" : "grid"} className="h-4 w-4" />
            </button>
          ))}
        </div>

        <Menu label="Filter" icon="sliders" badge={p.activeCities.length || undefined} align="right">
          {(close) => (
            <div className="w-56 p-1">
              <MenuTitle>Kota</MenuTitle>
              <ul className="max-h-56 space-y-0.5 overflow-y-auto">
                {p.cities.map((c) => (
                  <li key={c}>
                    <CheckItem label={c} checked={p.activeCities.includes(c)} onChange={() => p.onToggleCity(c)} />
                  </li>
                ))}
              </ul>
              {p.activeCities.length > 0 && (
                <button
                  type="button"
                  onClick={() => { p.onClearCities(); close(); }}
                  className="mt-1 w-full rounded-lg px-3 py-1.5 text-sm text-zinc-400 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-blue-500"
                >
                  Bersihkan filter
                </button>
              )}
            </div>
          )}
        </Menu>

        <Menu label="Kolom" icon="columns" align="right">
          {() => (
            <div className="w-52 p-1">
              <MenuTitle>Tampilkan kolom</MenuTitle>
              <ul className="space-y-0.5">
                {ALL_COLUMNS.map((c) => (
                  <li key={c.id}>
                    <CheckItem label={c.label} checked={p.visible.includes(c.id)} onChange={() => p.onToggleColumn(c.id)} />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Menu>
      </div>
    </div>
  );
}
