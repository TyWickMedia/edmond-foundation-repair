import type { Item } from "./types";

export const lineTotal = (i: Item) => Math.round((Number(i.qty) || 0) * (Number(i.price) || 0) * 100) / 100;
export const sumItems = (items: Item[]) =>
  Math.round(items.reduce((s, i) => s + lineTotal(i), 0) * 100) / 100;

export const usd = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });

/** Keep only rows that say something. */
export const cleanItems = (items: Item[]): Item[] =>
  items
    .map((i) => ({
      description: String(i.description ?? "").trim(),
      qty: Number(i.qty) || 0,
      price: Number(i.price) || 0,
    }))
    .filter((i) => i.description && i.qty > 0);

/** US-centric: 10 digits -> +1XXXXXXXXXX. Returns null if it doesn't look like a phone. */
export function toE164(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const d = raw.replace(/\D/g, "");
  if (d.length === 10) return `+1${d}`;
  if (d.length === 11 && d.startsWith("1")) return `+${d}`;
  if (raw.trim().startsWith("+") && d.length >= 8) return `+${d}`;
  return null;
}
