import type { ReactNode } from "react";
import { Icon } from "@/components/ui/Icon.tsx";
import { cx } from "@/lib/cx.ts";
import { t } from "@/components/ui/theme.ts";
import type { SortId } from "@/features/users/_logic/columns.ts";
import { SORT_OPTIONS } from "@/features/users/_logic/columns.ts";
import type { UserRow } from "@/features/users/_logic/types.ts";
import { avatarColor, initials } from "@/features/users/user-display.ts";

export function Avatar({ name }: { name: string }) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold ring-1 ring-white/10",
        avatarColor(name),
      )}
    >
      {initials(name)}
    </span>
  );
}

export function UserIdentity({ row }: { row: UserRow }) {
  return (
    <span className="flex items-center gap-3">
      <Avatar name={row.user.name} />
      <span className="min-w-0">
        <span className="block font-medium whitespace-nowrap text-zinc-100">{row.user.name}</span>
        <span className="block truncate text-xs text-zinc-500">{row.user.email}</span>
      </span>
    </span>
  );
}

export function WebsiteBadge({ row }: { row: UserRow }) {
  return (
    <a
      href={row.siteHref}
      target="_blank"
      rel="noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="group inline-flex max-w-44 items-center gap-1 rounded-full border border-white/10 bg-white/5 py-1 pr-2 pl-2.5 text-xs text-zinc-300 transition hover:border-blue-500/50 hover:bg-blue-500/10 hover:text-blue-300 focus-visible:outline-2 focus-visible:outline-blue-500"
    >
      <span className="truncate">{row.user.website}</span>
      <Icon
        name="arrowUpRight"
        className="h-3.5 w-3.5 shrink-0 text-zinc-600 transition group-hover:-translate-y-px group-hover:translate-x-px group-hover:text-blue-300"
      />
    </a>
  );
}

export function Th({
  id, sort, onSort, children, plain,
}: {
  id?: SortId; sort?: SortId; onSort?: (s: SortId) => void; children: ReactNode; plain?: boolean;
}) {
  if (plain || !id) return <th scope="col" className={t.th}>{children}</th>;
  const flip = SORT_OPTIONS.find((o) => o.id !== id && o.id.startsWith(id.split("-")[0]));
  const active = sort?.startsWith(id.split("-")[0]);
  return (
    <th scope="col" className={t.th}>
      <button
        type="button"
        onClick={() => onSort?.(active && sort === id ? (flip?.id ?? id) : id)}
        className="inline-flex items-center rounded transition hover:text-white focus-visible:outline-2 focus-visible:outline-blue-500"
      >
        {children}
        <span className={cx("ml-1 inline-flex", active ? "text-zinc-200" : "text-zinc-600")} aria-hidden="true">
          <Icon name={active && sort?.endsWith("desc") ? "chevronDown" : "chevronUp"} className="h-3.5 w-3.5" />
        </span>
      </button>
    </th>
  );
}
