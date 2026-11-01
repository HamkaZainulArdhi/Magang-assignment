import { useUserTable } from "@/features/users/_logic/useUserTable.ts";
import { CardsSkeleton, TableSkeleton } from "@/components/ui/Skeleton.tsx";
import { EmptySearchState, ErrorState } from "@/components/ui/States.tsx";
import { Icon } from "@/components/ui/Icon.tsx";
import { t } from "@/components/ui/theme.ts";
import { UserToolbar } from "@/features/users/_components/UserToolbar.tsx";
import { UserDataTable } from "@/features/users/_components/UserDataTable.tsx";
import { UserCardGrid } from "@/features/users/_components/UserCardGrid.tsx";
import { UserDetailModal } from "@/features/users/_components/UserDetailModal.tsx";
import { Pagination } from "@/features/users/_components/Pagination.tsx";

export function UserDashboard() {
  const tb = useUserTable();
  const pick = (u: { id: number }) => tb.setSelectedId(u.id);
  const grid = (cls: string) => (
    <div className={cls}>
      <UserCardGrid rows={tb.pageItems} visible={tb.visible} onSelect={pick} />
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-3 py-6 sm:px-6 sm:py-8">
      <header className="mb-4 flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-100 sm:text-2xl">Dasbor Pengguna</h1>
          <p className="mt-0.5 text-sm text-zinc-500">Kelola pengguna, perusahaan, dan kota.</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {tb.selectedIds.length > 0 && (
            <p role="status" className={t.chip(true)}>{tb.selectedIds.length} dipilih</p>
          )}
          {tb.isValidating && !tb.isLoading && (
            <p role="status" className={t.chip(false)}>
              <Icon name="refresh" className="h-3.5 w-3.5 animate-spin" />
              Menyinkronkan…
            </p>
          )}
        </div>
      </header>

      <section aria-label="Panel pengguna" className="rounded-2xl border border-white/10 bg-[#0e0e11] p-3 shadow-2xl sm:p-4">
        <UserToolbar
          query={tb.query} onQuery={(v) => tb.set("query", v)}
          sort={tb.sort} onSort={(s) => tb.set("sort", s)}
          cities={tb.allCities} activeCities={tb.cities}
          onToggleCity={tb.toggleCity} onClearCities={() => { tb.setCities([]); }}
          visible={tb.visible} onToggleColumn={tb.toggleColumn}
          view={tb.view} onView={tb.setView}
        />

        <div className="mt-3">
          {tb.isLoading ? (
            tb.view === "tabel" ? <TableSkeleton /> : <CardsSkeleton />
          ) : tb.error ? (
            <ErrorState message={tb.error.message} onRetry={tb.retry} isRetrying={tb.isValidating} />
          ) : tb.filtered.length === 0 ? (
            <EmptySearchState onClear={tb.clearAll} />
          ) : tb.view === "kartu" ? grid("") : (
            <>
              <div className="hidden md:block">
                <UserDataTable
                  rows={tb.pageItems} selectedIds={tb.selectedIds}
                  onToggleSelect={tb.toggleSelect} onToggleAll={tb.toggleAll}
                  visible={tb.visible} sort={tb.sort} onSort={(s) => tb.set("sort", s)}
                  onSelect={pick}
                />
              </div>
              {grid("mt-3 md:hidden")}
            </>
          )}
        </div>

        {tb.filtered.length > 0 && (
          <div className="mt-3 border-t border-white/10 px-1 pt-3">
            <Pagination page={tb.page} totalPages={tb.totalPages} pageSize={tb.pageSize} total={tb.total} onPage={tb.goPage} onPageSize={(s) => { tb.setPageSize(s); }} />
          </div>
        )}
      </section>

      {tb.selected && <UserDetailModal row={tb.selected} onClose={() => tb.setSelectedId(null)} />}
    </div>
  );
}
