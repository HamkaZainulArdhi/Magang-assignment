import type { User } from "@/types/user.ts";
import { cx } from "@/lib/cx.ts";
import { t } from "@/components/ui/theme.ts";
import { stop } from "@/lib/cx.ts";
import { Th, UserIdentity, WebsiteBadge } from "./parts.tsx";
import type { ColumnId, SortId } from "../_logic/columns.ts";
import type { UserRow } from "../_logic/types.ts";

interface DataTableProps {
  rows: UserRow[];
  selectedIds: number[];
  onToggleSelect: (id: number) => void;
  onToggleAll: () => void;
  visible: ColumnId[];
  sort: SortId;
  onSort: (s: SortId) => void;
  onSelect: (user: User) => void;
}

export function UserDataTable(p: DataTableProps) {
  const has = (c: ColumnId) => p.visible.includes(c);
  const all = p.rows.length > 0 && p.rows.every((r) => p.selectedIds.includes(r.user.id));

  return (
    <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#131316]">
      <table className="w-full min-w-250 text-left text-sm">
        <thead>
          <tr className="border-b border-white/10 text-[13px] text-zinc-300">
            <th scope="col" className="w-12 px-4 py-3">
              <input type="checkbox" checked={all} onChange={p.onToggleAll} aria-label="Pilih semua di halaman ini" className={t.check} />
            </th>
            <Th id="nama-asc" sort={p.sort} onSort={p.onSort}>Pengguna</Th>
            {has("phone") && <Th plain>Telepon</Th>}
            {has("company") && <Th id="perusahaan-asc" sort={p.sort} onSort={p.onSort}>Perusahaan</Th>}
            {has("website") && <Th plain>Website</Th>}
            {has("city") && <Th plain>Kota</Th>}
            <th scope="col" className="w-12 px-4 py-3"><span className="sr-only">Aksi</span></th>
          </tr>
        </thead>
        <tbody>
          {p.rows.map((r) => {
            const u = r.user;
            return (
              <tr key={u.id} onClick={() => p.onSelect(u)} tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter" && e.target === e.currentTarget) p.onSelect(u); }}
                className="cursor-pointer border-b border-white/5 transition last:border-0 hover:bg-white/[0.03] focus-visible:outline-2 focus-visible:outline-blue-500">
                <td className={t.td} onClick={stop}>
                  <input type="checkbox" checked={p.selectedIds.includes(u.id)} onChange={() => p.onToggleSelect(u.id)} aria-label={`Pilih ${u.name}`} className={t.check} />
                </td>
                <td className={t.td}><UserIdentity row={r} /></td>
                {has("phone") && <td className={cx(t.td, "whitespace-nowrap text-zinc-300")}>{u.phone}</td>}
                {has("company") && <td className={cx(t.td, "whitespace-nowrap text-zinc-300")}>{r.company}</td>}
                {has("website") && <td className={t.td}><WebsiteBadge row={r} /></td>}
                {has("city") && <td className={cx(t.td, "whitespace-nowrap text-zinc-300")}>{r.city}</td>}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
