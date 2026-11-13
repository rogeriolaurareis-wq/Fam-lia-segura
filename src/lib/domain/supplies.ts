import type { SupplyCategory, SupplyItem, Unit } from "./types";

export interface ShortageGroup {
  category: SupplyCategory;
  name: string;
  unit: Unit;
  quantity: number;
  target: number;
  missing: number;
}

/**
 * Shortages grouped by category + normalized name + unit. Different units are never summed
 * together: "2 kg" and "3 pacote" of the same item become two separate lines.
 */
export function computeShortages(items: SupplyItem[]): ShortageGroup[] {
  const groups = new Map<string, ShortageGroup>();
  for (const it of items) {
    if (it.target === null || !Number.isFinite(it.target)) continue;
    const key = `${it.category}|${it.name.trim().toLowerCase()}|${it.unit}`;
    const g = groups.get(key) ?? {
      category: it.category,
      name: it.name.trim(),
      unit: it.unit,
      quantity: 0,
      target: 0,
      missing: 0,
    };
    g.quantity += it.quantity;
    g.target = Math.max(g.target, it.target);
    groups.set(key, g);
  }
  return [...groups.values()]
    .map((g) => ({ ...g, missing: Math.max(0, Math.round((g.target - g.quantity) * 100) / 100) }))
    .filter((g) => g.missing > 0);
}

export function isExpired(date: string, today: Date = new Date()): boolean {
  if (!date) return false;
  const d = new Date(`${date}T23:59:59`);
  return Number.isFinite(d.getTime()) && d < today;
}

export function expiresWithin(date: string, days: number, today: Date = new Date()): boolean {
  if (!date) return false;
  const d = new Date(`${date}T23:59:59`);
  if (!Number.isFinite(d.getTime()) || d < today) return false;
  return d.getTime() - today.getTime() <= days * 86400000;
}
