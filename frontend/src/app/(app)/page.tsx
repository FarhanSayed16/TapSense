"use client";

import Link from "next/link";
import { Droplets, Shield } from "lucide-react";
import { Badge, StatusDot } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { KpiStat } from "@/components/ui/KpiStat";
import { MiniBars } from "@/components/ui/MiniBars";
import { ErrorRetry, LoadingBlock } from "@/components/ui/QueryState";
import { useScale } from "@/lib/scale-context";
import { useApiData } from "@/lib/useApiData";
import {
  campusDateKey,
  DailyAggregate,
  Device,
  formatLiters,
  formatRelative,
  formatWhen,
  litersOnDate,
  literTrend,
  Overview,
  sumWindow,
  tapLabel,
  tapWeekTrend,
  weekTrend,
} from "@/lib/types";

export default function OverviewPage() {
  const { overviewPath } = useScale();
  const overview = useApiData<Overview>(overviewPath, { refreshMs: 3000 });
  const daily = useApiData<DailyAggregate[]>("/api/v1/aggregates/daily?days=14", { refreshMs: 5000 });
  const devices = useApiData<Device[]>("/api/v1/devices", { refreshMs: 3000 });

  const loading = overview.loading || daily.loading || devices.loading;
  const error = overview.error || daily.error || devices.error;
  const reload = () => {
    void overview.reload();
    void daily.reload();
    void devices.reload();
  };

  if (loading && !overview.data) return <LoadingBlock rows={4} />;
  if (error && !overview.data) return <ErrorRetry message={error} onRetry={reload} />;
  if (!overview.data) {
    return (
      <EmptyState
        title="Waiting for first flow readings"
        description="Connect your ESP device and open a tap — data will appear here automatically."
        icon="water"
      />
    );
  }

  const o = overview.data;
  const rows = daily.data ?? [];
  const byTapToday = new Map<string, number>(Object.entries(o.tap_liters_today ?? {}));
  const lastAct = o.tap_last_activity ?? {};
  const open = o.open_sessions ?? [];
  const trend = weekTrend(rows, 7);
  const priorWeek = weekTrend(rows, 14).slice(0, 7);
  const yesterdayKey = campusDateKey(-1);
  const todayTrend = literTrend(o.liters_today, litersOnDate(rows, yesterdayKey));
  const weekTrendKpi = literTrend(sumWindow(trend), sumWindow(priorWeek));
  const onlineCount = (devices.data ?? []).filter((d) => d.status === "online").length;
  const staleCount = (devices.data ?? []).filter((d) => d.status === "stale").length;
  const status: "online" | "stale" | "unknown" =
    onlineCount > 0 ? "online" : staleCount > 0 ? "stale" : o.device_online ? "online" : "unknown";

  return (
    <div className="space-y-8">
      {/* ── Page Header ── */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight text-ink">Overview</h1>
          <p className="mt-1 text-sm text-ink-secondary">
            {o.location.building_name} · {o.location.floor_name} · {o.location.zone_name}
          </p>
        </div>
        <button
          type="button"
          onClick={reload}
          className="rounded-lg border border-line bg-surface px-4 py-2 text-xs font-semibold text-ink-secondary shadow-soft transition-colors hover:bg-bg-subtle hover:text-ink"
        >
          Refresh
        </button>
      </div>

      {/* ── KPI Row ── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiStat
          label="Liters today"
          value={formatLiters(o.liters_today)}
          hint="All taps · vs yesterday"
          trend={todayTrend}
        />
        <KpiStat
          label="Liters this week"
          value={formatLiters(o.liters_week)}
          hint="Last 7 days · vs prior week"
          trend={weekTrendKpi}
        />
        <KpiStat
          label="Active sessions"
          value={String(o.active_sessions)}
          hint={open.length > 0 ? "Flowing now" : "No flow"}
        />
        <KpiStat
          label="Device status"
          value={status === "online" ? "Online" : status === "stale" ? "Stale" : "Unknown"}
          hint={formatWhen(o.device_last_seen_at)}
          trend={
            status === "online"
              ? { direction: "up" as const, text: "Connected" }
              : status === "stale"
                ? { direction: "down" as const, text: "Check device" }
                : null
          }
        />
      </div>

      {/* ── Live Sessions ── */}
      <section className={`card p-5 ${open.length > 0 ? "border-ok/25 ring-1 ring-ok/10" : ""}`}>
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-ink">Live Flow</h2>
          <StatusDot status={open.length ? "online" : "unknown"} />
        </div>
        {open.length === 0 ? (
          <p className="text-sm text-ink-secondary">
            No taps flowing right now — open a faucet to see a live session appear here.
          </p>
        ) : (
          <ul className="space-y-2">
            {open.map((s) => (
              <li
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-ok/20 bg-ok-bg/40 px-4 py-3"
              >
                <div>
                  <p className="font-semibold text-ink">{tapLabel(o.taps, s.tap_id)}</p>
                  <p className="text-xs text-ink-secondary">
                    Started {formatWhen(s.started_at)} · last pulse {formatRelative(s.last_flow_at)}
                  </p>
                </div>
                <p className="kpi-value text-lg text-ok">{formatLiters(s.liters)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── Tap Status ── */}
      <section>
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-ink">Tap Status</h2>
          <StatusDot status={status === "online" ? "online" : status === "stale" ? "stale" : "unknown"} />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {o.taps.map((tap, index) => {
            const flowing = open.some((s) => s.tap_id === tap.id);
            const spark = tapWeekTrend(rows, tap.id, 7);
            const weekL = sumWindow(spark);
            return (
              <Link
                key={tap.id}
                href={`/taps/${tap.id}`}
                className={`card card-interactive p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover animate-card-enter ${
                  flowing ? "border-ok/30 bg-ok-bg/20" : tap.is_control ? "border-dashed border-control/30" : ""
                }`}
                style={{ animationDelay: `${index * 40}ms` }}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {flowing ? (
                      <span className="h-2.5 w-2.5 rounded-full bg-ok animate-flow-ripple" />
                    ) : tap.is_control ? (
                      <Shield className="h-4 w-4 text-control" strokeWidth={1.75} />
                    ) : (
                      <Droplets className="h-4 w-4 text-brand" strokeWidth={1.75} />
                    )}
                    <p className="font-semibold text-ink">{tap.name}</p>
                  </div>
                  {tap.is_control ? <Badge kind="control">Control</Badge> : null}
                </div>
                <p className="kpi-value mt-3 text-2xl text-ink">
                  {formatLiters(byTapToday.get(tap.id) ?? 0)}
                </p>
                <p className="mt-1 text-xs text-ink-secondary">
                  today · {formatLiters(weekL)} this week
                </p>
                <div className="mt-4">
                  <MiniBars points={spark} compact />
                </div>
                <p className="mt-3 text-xs text-muted">
                  {flowing ? (
                    <span className="font-medium text-ok">Flowing now</span>
                  ) : (
                    `Last activity: ${formatRelative(lastAct[tap.id])}`
                  )}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── Weekly Trend ── */}
      <section className="card p-5">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-ink">Weekly Trend</h2>
            <p className="mt-0.5 text-xs text-muted">Campus total liters by day</p>
          </div>
          {!trend.every((p) => p.liters === 0) ? (
            <p className="text-sm font-medium text-ink-secondary">
              {formatLiters(sumWindow(trend))}
              <span className="ml-1 text-xs font-normal text-muted">over 7 days</span>
            </p>
          ) : null}
        </div>
        {trend.every((p) => p.liters === 0) ? (
          <EmptyState
            title="Collecting trend data"
            description="Your first daily chart will appear after 24 hours of sensor readings."
            icon="water"
            className="border-0 bg-transparent py-8"
          />
        ) : (
          <MiniBars points={trend} />
        )}
      </section>
    </div>
  );
}
