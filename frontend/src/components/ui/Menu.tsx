import { useEffect, useRef, useState, type ReactNode } from "react";
import { cx } from "@/lib/cx.ts";
import { Icon } from "@/components/ui/Icon.tsx";
import { t } from "@/components/ui/theme.ts";

export function Menu({
  label,
  icon,
  badge,
  children,
  align = "left",
}: {
  label: string;
  icon: "filter" | "sort" | "sliders" | "columns";
  badge?: number;
  children: (close: () => void) => ReactNode;
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open ]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={icon === "sliders" ? "inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400 active:scale-[0.98]" : t.btnGhost}
      >
        <Icon name={icon} className="h-4 w-4 text-zinc-400" />
        {label}
        {badge ? (
          <span className="rounded-full bg-white/20 px-1.5 text-xs font-semibold">{badge}</span>
        ) : null}
      </button>
      {open && (
        <div role="menu" className={cx(t.pop, align === "right" ? "right-0" : "left-0")}>
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

export function MenuOption({
  active,
  onPick,
  children,
}: {
  active: boolean;
  onPick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="menuitemradio"
      aria-checked={active}
      onClick={onPick}
      className={cx(t.item, active ? "text-white" : "text-zinc-400")}
    >
      {children}
      {active && <Icon name="check" className="h-4 w-4 text-blue-500" />}
    </button>
  );
}

export function CheckItem({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-zinc-300 transition hover:bg-white/10">
      <input type="checkbox" checked={checked} onChange={onChange} className={t.check} />
      {label}
    </label>
  );
}

export function MenuTitle({ children }: { children: ReactNode }) {
  return (
    <p className="px-2 py-1 text-xs font-semibold tracking-wide text-zinc-500 uppercase">
      {children}
    </p>
  );
}
