"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge, StatusDot } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { KpiStat } from "@/components/ui/KpiStat";
import { MiniBars } from "@/components/ui/MiniBars";
import { ErrorRetry, LoadingBlock } from "@/components/ui/QueryState";
import { ApiError, apiFetch } from "@/lib/api";
import { useApiData } from "@/lib/useApiData";
import {
  DailyAggregate,
  Device,
  formatLiters,
  Overview,
  sumByDate,
} from "@/lib/types";

export default function OverviewPage() {
  const overview = useApiData<Overview>("/api/v1/overview", { refreshMs: 3000 });
  const daily = useApiData<DailyAggregate[]>("/api/v1/aggregates/daily?days=7", { refreshMs: 5000 });
  const device = useApiData<Device>("/api/v1/devices/device_01", { refreshMs: 3000 });
  const [resetting, setResetting] = useState(false);
  const [resetMsg, setResetMsg] = useState<string | null>(null);

  const loading = overview.loading || daily.loading || device.loading;
  const error = overview.error || daily.error || device.error;
  const reload = () => {
    void overview.reload();
    void daily.reload();
    void device.reload();
  };

  const resetToday = async () => {
    const ok = window.confirm(
      "Reset all of today's water data?\n\nThis clears today's sessions, readings, and liter totals so you can start the day clean. This cannot be undone.",
    );
    if (!ok) return;
    setResetting(true);
    setResetMsg(null);
    try {
      const result = await apiFetch<{
        date: string;
        deleted: { sessions: number; readings: number; daily_aggregates: number };
      }>("/api/v1/admin/reset-today", { method: "POST" });
      setResetMsg(
        `Reset ${result.date}: removed ${result.deleted.sessions} sessions, ${result.deleted.readings} readings, ${result.deleted.daily_aggregates} daily totals.`,
      );
      reload();
    } catch (err) {
      setResetMsg(err instanceof ApiError ? err.message : "Reset failed");
    } finally {
      setResetting(false);
    }
  };

  if (loading && !overview.data) return <LoadingBlock rows={4} />;
  if (error && !overview.data) return <ErrorRetry message={error} onRetry={reload} />;
  if (!overview.data) {
    return (
      <EmptyState
        title="Waiting for first pulses from the washroom ESP"
        description="Seed the backend and run simulate_ingest, or connect device_01."
      />
    );
  }

  const o = overview.data;
  const byTapToday = new Map<string, number>(Object.entries(o.tap_liters_today ?? {}));
  if (byTapToday.size === 0) {
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    for (const row of daily.data ?? []) {
      if (row.date === today) {
        byTapToday.set(row.tap_id, (byTapToday.get(row.tap_id) ?? 0) + row.liters);
      }
    }
  }
  const trend = sumByDate(daily.data ?? []);
  const status = device.data?.status ?? (o.device_online ? "online" : "unknown");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Overview</h1>
          <p className="mt-1 text-sm text-muted">
            {o.location.building_name} · {o.location.floor_name} · {o.location.zone_name}
          </p>
          <p className="mt-1 text-xs text-muted">Live refresh every 3s · device {status}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={reload}
            className="rounded-md border border-line px-3 py-1.5 text-xs font-medium text-ink hover:border-brand/40"
          >
            Refresh now
          </button>
          <Button variant="danger" className="min-h-9 px-3 text-xs" disabled={resetting} onClick={() => void resetToday()}>
            {resetting ? "Resetting…" : "Reset today"}
          </Button>
          <Badge kind="phase">Phase 0 — Baseline</Badge>
        </div>
      </div>

      {resetMsg ? <p className="text-sm text-muted">{resetMsg}</p> : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiStat label="Liters today" value={formatLiters(o.liters_today)} hint="All taps" />
        <KpiStat label="Liters this week" value={formatLiters(o.liters_week)} />
        <KpiStat label="Active sessions" value={String(o.active_sessions)} />
        <KpiStat
          label="Device"
          value={status}
          hint={device.data?.id ?? "device_01"}
        />
      </div>

      <section className="rounded-xl border border-line bg-surface/90 p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-ink">Taps</h2>
          <StatusDot status={status === "online" ? "online" : status === "stale" ? "stale" : "unknown"} />
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {o.taps.map((tap) => (
            <Link
              key={tap.id}
              href={`/taps/${tap.id}`}
              className="rounded-lg border border-line bg-white/70 p-3 transition hover:border-brand/40"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium text-ink">{tap.name}</p>
                {tap.is_control ? <Badge kind="control">Control</Badge> : null}
              </div>
              <div className="mt-2 flex items-center justify-between">
                <p className="mono text-xs text-muted">{tap.id}</p>
                <p className="mono text-sm text-ink">
                  {formatLiters(byTapToday.get(tap.id) ?? 0)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-line bg-surface/90 p-4">
        <h2 className="mb-4 text-sm font-semibold text-ink">Last 7 days</h2>
        {trend.every((p) => p.liters === 0) ? (
          <EmptyState
            title="No usage totals yet"
            description="Run a simulate_ingest or wait for ESP telemetry."
            className="border-0 bg-transparent py-8"
          />
        ) : (
          <MiniBars points={trend} />
        )}
      </section>
    </div>
  );
}
