type Falsy = false | null | undefined | 0 | "";

export function cx(...parts: Array<string | Falsy>): string {
  return parts.filter(Boolean).join(" ");
}

export const stop = (e: { stopPropagation: () => void }): void => e.stopPropagation();
