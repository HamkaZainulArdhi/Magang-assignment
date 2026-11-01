export function TableSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-[#131316]" aria-hidden="true">
      <div className="animate-pulse">
        <div className="h-12 bg-white/[0.03]" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-4 border-t border-white/5 px-4 py-4">
            <div className="h-4 w-4 rounded bg-white/10" />
            <div className="h-9 w-9 rounded-full bg-white/10" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/3 rounded bg-white/10" />
              <div className="h-3 w-1/2 rounded bg-white/5" />
            </div>
            <div className="hidden h-4 w-24 rounded bg-white/5 sm:block" />
          </div>
        ))}
      </div>
      <span className="sr-only">Memuat pengguna…</span>
    </div>
  );
}

export function CardsSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-hidden="true">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-xl border border-white/10 bg-[#131316] p-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-white/10" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-2/3 rounded bg-white/10" />
              <div className="h-3 w-1/2 rounded bg-white/5" />
            </div>
          </div>
        </div>
      ))}
      <span className="sr-only">Memuat pengguna…</span>
    </div>
  );
}
