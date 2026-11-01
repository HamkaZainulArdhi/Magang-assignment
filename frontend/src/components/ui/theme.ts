import { cx } from "@/lib/cx.ts";

export const t = {
  panel: "rounded-xl border border-white/10 bg-[#131316]",
  pop: "absolute z-20 mt-2 overflow-hidden rounded-xl border border-white/10 bg-[#1a1a1f] p-1 shadow-xl",
  item: "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-blue-500",
  btnGhost:
    "inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3.5 py-2 text-sm font-medium text-zinc-200 transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 active:scale-[0.98]",
  btnIcon:
    "rounded-lg p-1.5 text-zinc-500 transition hover:bg-white/10 hover:text-zinc-200 focus-visible:outline-2 focus-visible:outline-blue-500",
  link: "rounded text-blue-400 transition hover:text-blue-300 hover:underline focus-visible:outline-2 focus-visible:outline-blue-500",
  check: "h-4 w-4 rounded accent-blue-600",
  th: "px-4 py-3 font-medium whitespace-nowrap",
  td: "px-4 py-3.5",
  cardLabel: "text-zinc-500",
  cardValue: "truncate text-zinc-300",
  chip: (on: boolean) =>
    cx(
      "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs ring-1",
      on
        ? "bg-blue-600/15 text-blue-300 ring-blue-500/30"
        : "bg-white/5 text-zinc-400 ring-white/10",
    ),
};
