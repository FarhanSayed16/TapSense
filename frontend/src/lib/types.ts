export type Tap = {
  id: string;
  name: string;
  org_id: string;
  campus_id: string;
  building_id: string;
  floor_id: string;
  zone_id: string;
  is_control: boolean;
  device_id: string;
  pulses_per_liter: number;
  role: "control" | "intervention";
};

export type Device = {
  id: string;
  org_id: string;
  name: string;
  tap_ids: string[];
  last_seen_at: string | null;
  firmware_version: string | null;
  status: "online" | "stale" | "unknown";
  wifi_rssi?: number | null;
  architecture?: "multi_tap" | "single_tap";
  building_id?: string | null;
  floor_id?: string | null;
  zone_id?: string | null;
  mqtt_topic?: string | null;
};

export type Session = {
  id: string;
  tap_id: string;
  device_id: string;
  started_at: string;
  ended_at: string | null;
  liters: number;
  duration_seconds: number | null;
  is_long_tail: boolean;
};

export type OpenSession = {
  id: string;
  tap_id: string;
  liters: number;
  started_at: string;
  last_flow_at: string | null;
};

export type DailyAggregate = {
  tap_id: string;
  date: string;
  liters: number;
  session_count: number;
};

export type Overview = {
  location: {
    org_id: string;
    org_name: string;
    campus_id: string;
    campus_name: string;
    building_id: string;
    building_name: string;
    floor_id: string;
    floor_name: string;
    zone_id: string;
    zone_name: string;
  };
  liters_today: number;
  liters_week: number;
  active_sessions: number;
  device_online: boolean;
  taps: Tap[];
  tap_liters_today?: Record<string, number>;
  tap_last_activity?: Record<string, string | null>;
  open_sessions?: OpenSession[];
  health?: {
    mongo: boolean;
    redis: boolean | null;
    device_online: boolean;
    device_last_seen_at: string | null;
  };
  device_last_seen_at?: string | null;
  product_phase?: 0 | 1 | 2 | 3;
  phase_label?: string;
  visibility_enabled?: boolean;
  color_enabled?: boolean;
  social_enabled?: boolean;
};

export type ProductPhase = {
  product_phase: 0 | 1 | 2 | 3;
  label: string;
  visibility_enabled: boolean;
  color_enabled?: boolean;
  social_enabled?: boolean;
  updated_at: string | null;
};

export type ColorBand = "green" | "amber" | "red" | "idle" | "control";

export type VisibilityLive = {
  product_phase: number;
  visibility_enabled: boolean;
  color_enabled?: boolean;
  label: string;
  rule: string;
  bands?: { green_max_ratio: number; amber_max_ratio: number };
  channels: {
    tap_id: string;
    name: string;
    session_open: boolean;
    session_liters: number;
    last_flow_at: string | null;
    threshold_liters?: number;
    enabled?: boolean;
    band?: ColorBand;
  }[];
};

export type TapThreshold = {
  tap_id: string;
  name: string;
  is_control: boolean;
  enabled: boolean;
  session_liters_threshold: number;
  source: string;
  notes: string;
};

export type ThresholdsConfig = {
  bands: { green_max_ratio: number; amber_max_ratio: number };
  taps: Record<string, TapThreshold>;
  rule: string;
  honesty: string;
  updated_at: string | null;
  timezone: string;
};

export type PhaseWindow = {
  phase: number;
  label: string;
  start: string | null;
  end: string | null;
  notes: string;
};

export type PhaseWindows = {
  timezone: string;
  windows: Record<string, PhaseWindow>;
  updated_at: string | null;
};

export type CohortMetrics = {
  mean_liters_per_day: number;
  mean_session_liters: number;
  long_tail_session_pct: number;
  n_taps: number;
};

export type PhaseCompare = {
  phase_a: {
    phase: number;
    label: string;
    start: string;
    end: string;
    overall: Record<string, number>;
    control: CohortMetrics;
    intervention: CohortMetrics;
  };
  phase_b: {
    phase: number;
    label: string;
    start: string;
    end: string;
    overall: Record<string, number>;
    control: CohortMetrics;
    intervention: CohortMetrics;
  };
  per_tap_delta: Record<
    string,
    {
      name: string;
      is_control: boolean;
      mean_liters_per_day: { a: number; b: number; delta_pct: number | null };
      mean_session_liters: { a: number; b: number; delta_pct: number | null };
      long_tail_session_pct: { a: number; b: number; delta_pp: number };
      session_count: { a: number; b: number };
    }
  >;
  honesty: string;
  generated_at: string;
  timezone: string;
};

export type ControlSplit = {
  start: string;
  end: string;
  timezone: string;
  generated_at: string;
  split: {
    control: CohortMetrics;
    intervention: CohortMetrics;
  };
  overall: Record<string, number>;
  honesty: string;
};

export type AlertRow = {
  id: string;
  type: string;
  device_id: string;
  status: string;
  last_seen_at: string | null;
  age_seconds: number | null;
  open: boolean;
  updated_at: string;
};

export function formatLiters(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return `${n.toFixed(n >= 10 ? 1 : 2)} L`;
}

export function formatWhen(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatRelative(iso: string | null | undefined): string {
  if (!iso) return "No activity yet";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const sec = Math.max(0, Math.round((Date.now() - d.getTime()) / 1000));
  if (sec < 10) return "just now";
  if (sec < 60) return `${sec}s ago`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  return formatWhen(iso);
}

export function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null || !Number.isFinite(seconds)) return "—";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}m ${s}s`;
}

export function locationCrumb(loc: Overview["location"]): string {
  return `${loc.org_name} › ${loc.building_name} › ${loc.floor_name} › ${loc.zone_name}`;
}

export function sumByDate(rows: DailyAggregate[]): { date: string; liters: number }[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    map.set(row.date, (map.get(row.date) ?? 0) + row.liters);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, liters]) => ({ date, liters }));
}

/** Pad last N campus days so the week chart always shows a full strip. */
export function weekTrend(
  rows: DailyAggregate[],
  days = 7,
  timeZone = "Asia/Kolkata",
): { date: string; liters: number }[] {
  const byDate = sumByDate(rows);
  const map = new Map(byDate.map((p) => [p.date, p.liters]));
  const out: { date: string; liters: number }[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    const key = d.toLocaleDateString("en-CA", { timeZone });
    out.push({ date: key, liters: map.get(key) ?? 0 });
  }
  return out;
}

/** Per-tap daily series padded to the last N days (for sparklines). */
export function tapWeekTrend(
  rows: DailyAggregate[],
  tapId: string,
  days = 7,
  timeZone = "Asia/Kolkata",
): { date: string; liters: number }[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    if (row.tap_id !== tapId) continue;
    map.set(row.date, (map.get(row.date) ?? 0) + row.liters);
  }
  const out: { date: string; liters: number }[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    const key = d.toLocaleDateString("en-CA", { timeZone });
    out.push({ date: key, liters: map.get(key) ?? 0 });
  }
  return out;
}

export type LiterTrend = {
  direction: "up" | "down" | "flat";
  text: string;
  pct: number | null;
};

/**
 * Compare two liter totals into a short trend for KPI cards.
 * Direction is conservation-aware: lower use = "up" (good), higher use = "down" (worse).
 */
export function literTrend(current: number, previous: number): LiterTrend | null {
  if (!Number.isFinite(current) || !Number.isFinite(previous)) return null;
  if (previous <= 0 && current <= 0) return { direction: "flat", text: "No change", pct: 0 };
  if (previous <= 0 && current > 0) {
    return { direction: "down", text: "Higher than prior", pct: null };
  }
  const pct = ((current - previous) / previous) * 100;
  const rounded = Math.round(Math.abs(pct));
  if (rounded === 0) return { direction: "flat", text: "Same as prior", pct: 0 };
  if (pct > 0) return { direction: "down", text: `${rounded}% higher`, pct: rounded };
  return { direction: "up", text: `${rounded}% lower`, pct: rounded };
}

/** Sum liters for a single calendar date across all taps. */
export function litersOnDate(rows: DailyAggregate[], date: string): number {
  let sum = 0;
  for (const row of rows) {
    if (row.date === date) sum += row.liters;
  }
  return sum;
}

/** Sum liters across a padded day window (inclusive indices into weekTrend-style list). */
export function sumWindow(points: { liters: number }[]): number {
  return points.reduce((acc, p) => acc + p.liters, 0);
}

export function campusDateKey(offsetDays = 0, timeZone = "Asia/Kolkata"): string {
  const d = new Date(Date.now() + offsetDays * 86400000);
  return d.toLocaleDateString("en-CA", { timeZone });
}

export function tapLabel(taps: Tap[], tapId: string): string {
  return taps.find((t) => t.id === tapId)?.name ?? "Unknown tap";
}

export function deviceLabel(devices: Device[], deviceId: string | undefined | null): string {
  if (!deviceId) return "Device";
  return devices.find((d) => d.id === deviceId)?.name ?? "Device";
}
