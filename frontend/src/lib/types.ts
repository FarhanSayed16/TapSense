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
