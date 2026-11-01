import { Icon } from "@/components/ui/Icon.tsx";

export function ErrorState({
  message,
  onRetry,
  isRetrying,
}: {
  message: string;
  onRetry: () => void;
  isRetrying: boolean;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-6 py-12 text-center"
    >
      <span className="rounded-full bg-red-500/10 p-3 text-red-400 ring-1 ring-red-500/20">
        <Icon name="alert" className="h-6 w-6" />
      </span>
      <div>
        <h2 className="font-semibold text-zinc-100">Terjadi kesalahan</h2>
        <p className="mt-1 text-sm text-zinc-400">{message}</p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        disabled={isRetrying}
        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400 active:scale-95 disabled:opacity-60"
      >
        <Icon
          name="refresh"
          className={`h-4 w-4 ${isRetrying ? "animate-spin" : ""}`}
        />
        {isRetrying ? "Mencoba lagi…" : "Coba lagi"}
      </button>
    </div>
  );
}

export function EmptySearchState({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-12 text-center">
      <span className="rounded-full bg-white/5 p-3 text-zinc-500 ring-1 ring-white/10">
        <Icon name="search" className="h-6 w-6" />
      </span>
      <div>
        <h2 className="font-semibold text-zinc-100">Pengguna tidak ditemukan</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Coba nama atau email lain.
        </p>
      </div>
      <button
        type="button"
        onClick={onClear}
        className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 active:scale-95"
      >
        Bersihkan pencarian
      </button>
    </div>
  );
}
