import type { User } from "@/types/user.ts";
import { t } from "@/components/ui/theme.ts";
import { UserIdentity, WebsiteBadge } from "./parts.tsx";
import type { ColumnId } from "../_logic/columns.ts";
import type { UserRow } from "../_logic/types.ts";

interface CardGridProps {
  rows: UserRow[];
  visible: ColumnId[];
  onSelect: (user: User) => void;
}

export function UserCardGrid({ rows, visible, onSelect }: CardGridProps) {
  const has = (c: ColumnId) => visible.includes(c);
  return (
    <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {rows.map((r) => {
        const u = r.user;
        return (
          <li key={u.id} className="rounded-xl border border-white/10 bg-[#131316] p-4 transition hover:border-white/20 focus-within:border-blue-500">
            <div className="flex items-start justify-between gap-2">
              <button type="button" onClick={() => onSelect(u)} className="min-w-0 flex-1 rounded-lg text-left focus-visible:outline-2 focus-visible:outline-blue-500">
                <UserIdentity row={r} />
              </button>
            </div>
            <dl className="mt-3 space-y-1.5 text-sm">
              {has("phone") && <div className="flex justify-between gap-2"><dt className={t.cardLabel}>Telepon</dt><dd className={t.cardValue}>{u.phone}</dd></div>}
              {has("company") && <div className="flex justify-between gap-2"><dt className={t.cardLabel}>Perusahaan</dt><dd className={t.cardValue}>{r.company}</dd></div>}
              {has("website") && <div className="flex items-center justify-between gap-2"><dt className={t.cardLabel}>Website</dt><dd><WebsiteBadge row={r} /></dd></div>}
              {has("city") && <div className="flex justify-between gap-2"><dt className={t.cardLabel}>Kota</dt><dd className={t.cardValue}>{r.city}</dd></div>}
            </dl>
          </li>
        );
      })}
    </ul>
  );
}
