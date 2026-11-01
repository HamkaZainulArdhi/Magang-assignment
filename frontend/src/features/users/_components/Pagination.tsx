import { Icon } from "@/components/ui/Icon.tsx";
import { cx } from "@/lib/cx.ts";

interface PaginationProps {
  page: number;
  totalPages: number;
  pageSize: number;
  total: number;
  onPage: (p: number) => void;
  onPageSize: (s: number) => void;
}

function pagesAround(page: number, total: number): (number | "gap")[] {
  const out: (number | "gap")[] = [];
  for (let n = 1; n <= total; n++) {
    if (n === 1 || n === total || Math.abs(n - page) <= 1) out.push(n);
    else if (out[out.length - 1] !== "gap") out.push("gap");
  }
  return out;
}

const navBtn =
  "rounded-lg p-2 text-zinc-400 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-blue-500 disabled:opacity-30 disabled:hover:bg-transparent";

export function Pagination({ page, totalPages, pageSize, total, onPage, onPageSize }: PaginationProps) {
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="inline-flex items-center gap-2 text-sm text-zinc-500">
        Baris per halaman
        <span className="relative inline-flex items-center">
          <select value={pageSize} onChange={(e) => onPageSize(Number(e.target.value))} aria-label="Baris per halaman"
            className="appearance-none rounded-lg border border-white/10 bg-white/5 py-1.5 pr-8 pl-3 text-sm text-zinc-200 transition hover:border-white/20 focus:border-blue-500 focus:outline-none">
            {[5, 10].map((s) => <option key={s} value={s} className="bg-[#1a1a1f]">{s}</option>)}
          </select>
          <span className="pointer-events-none absolute right-2 text-zinc-500"><Icon name="chevronDown" className="h-4 w-4" /></span>
        </span>
      </label>
      <p className="ml-auto text-sm text-zinc-500" role="status">
        {start}–{Math.min(page * pageSize, total)} dari {total}
      </p>
      <nav aria-label="Navigasi halaman" className="inline-flex items-center gap-1">
        <button type="button" onClick={() => onPage(page - 1)} disabled={page <= 1} aria-label="Halaman sebelumnya" className={navBtn}>
          <Icon name="chevronLeft" className="h-4 w-4" />
        </button>
        {pagesAround(page, totalPages).map((n, i) =>
          n === "gap" ? (
            <span key={`g${i}`} className="px-1 text-zinc-600" aria-hidden="true">…</span>
          ) : (
            <button key={n} type="button" onClick={() => onPage(n)} aria-label={`Halaman ${n}`} aria-current={n === page ? "page" : undefined}
              className={cx("min-w-9 rounded-lg px-2.5 py-1.5 text-sm transition focus-visible:outline-2 focus-visible:outline-blue-500",
                n === page ? "bg-white/10 font-semibold text-white" : "text-zinc-400 hover:bg-white/10 hover:text-white")}>
              {n}
            </button>
          ),
        )}
        <button type="button" onClick={() => onPage(page + 1)} disabled={page >= totalPages} aria-label="Halaman berikutnya" className={navBtn}>
          <Icon name="chevronRight" className="h-4 w-4" />
        </button>
      </nav>
    </div>
  );
}
