import type { User } from "@/types/user.ts";

export function getCity(user: User): string {
  return user.address.city;
}

export function getCompany(user: User): string {
  return user.company.name;
}

export function cityOptions(users: User[]): string[] {
  return [...new Set(users.map(getCity))].sort((a, b) => a.localeCompare(b));
}

export function siteHref(website: string): string {
  return website.startsWith("http") ? website : `https://${website}`;
}

export function avatarColor(name: string): string {
  const p = [
    "bg-indigo-500/20 text-indigo-300",
    "bg-emerald-500/20 text-emerald-300",
    "bg-amber-500/20 text-amber-300",
    "bg-rose-500/20 text-rose-300",
    "bg-sky-500/20 text-sky-300",
  ];
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return p[h % p.length];
}

export const initials = (name: string): string =>
  name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
