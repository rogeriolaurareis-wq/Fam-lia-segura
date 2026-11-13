import type { Treatment } from "./types";

/**
 * Arithmetic stock projection. Only computed when the user explicitly marked the daily
 * consumption as already validated (copied from an existing prescription). No dose logic.
 */
export function projectStockDays(t: Pick<Treatment, "stock" | "dailyConsumption" | "dailyConsumptionValidated">): number | null {
  if (!t.dailyConsumptionValidated) return null;
  if (t.dailyConsumption === null || !Number.isFinite(t.dailyConsumption) || t.dailyConsumption <= 0)
    return null;
  if (!Number.isFinite(t.stock) || t.stock < 0) return null;
  return Math.floor(t.stock / t.dailyConsumption);
}
