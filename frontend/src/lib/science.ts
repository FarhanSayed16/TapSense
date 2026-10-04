/** Campus-date helpers for Phase 15 science pages (Asia/Kolkata). */

export const CAMPUS_TZ = "Asia/Kolkata";

export function campusToday(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: CAMPUS_TZ });
}

export function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toLocaleDateString("en-CA", { timeZone: CAMPUS_TZ });
}

export function fmtPct(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(1)}%`;
}

export function fmtPp(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(1)} pp`;
}

export const PHASE_OPTIONS = [0, 1, 2, 3] as const;

export const DEFAULT_HONESTY =
  "Pilot N is small — treat deltas as descriptive, not powered causal proof.";
