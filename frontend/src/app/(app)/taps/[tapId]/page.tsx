"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Badge, StatusDot } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataRow, DataTable, Td } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input, Label } from "@/components/ui/Input";
import { KpiStat } from "@/components/ui/KpiStat";
import { MiniBars } from "@/components/ui/MiniBars";
import { ErrorRetry, LoadingBlock } from "@/components/ui/QueryState";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/cn";
import { apiFetch } from "@/lib/api";
import { useApiData } from "@/lib/useApiData";
import {
  DailyAggregate,
  Device,
  formatDuration,
  formatLiters,
  formatWhen,
  Session,
  Tap,
  tapWeekTrend,
} from "@/lib/types";

export default function TapDetailPage() {
  const params = useParams<{ tapId: string }>();
  const tapId = params.tapId;
  const { push } = useToast();
  const [days, setDays] = useState<7 | 14>(7);
  const [pplDraft, setPplDraft] = useState("");
  const [saving, setSaving] = useState(false);

  const tap = useApiData<Tap>(tapId ? `/api/v1/taps/${tapId}` : null);
  const daily = useApiData<DailyAggregate[]>(
    tapId ? `/api/v1/aggregates/daily?tap_id=${tapId}&days=${days}` : null,
  );
  const sessions = useApiData<Session[]>(
    tapId ? `/api/v1/sessions?tap_id=${tapId}&limit=30` : null,
  );
  const devices = useApiData<Device[]>("/api/v1/devices", { refreshMs: 5000 });
  const thresholds = useApiData<{
    taps: Record<string, { session_liters_threshold: number; enabled: boolean; is_control: boolean }>;
  }>("/api/v1/thresholds");

  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  const weekStart = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  })();

  const hostDevice = useMemo(() => {
    const list = devices.data ?? [];
    const fromTap = list.find((d) => d.id === tap.data?.device_id);
    if (fromTap) return fromTap;
    return list.find((d) => d.tap_ids?.includes(tapId)) ?? null;
  }, [devices.data, tap.data?.device_id, tapId]);

  const stats = useMemo(() => {
    let todayL = 0;
    let weekL = 0;
    for (const row of daily.data ?? []) {
      if (row.date === today) todayL += row.liters;
      if (row.date >= weekStart) weekL += row.liters;
    }
    const closed = (sessions.data ?? []).filter((s) => s.ended_at);
    const avg =
      closed.length > 0
        ? closed.reduce((a, s) => a + s.liters, 0) / closed.length
        : 0;
    const longTail = closed.filter((s) => s.is_long_tail).length;
    return { todayL, weekL, avg, longTail };
  }, [daily.data, sessions.data, today, weekStart]);

  // Pad to full 7/14-day strip so a single active day doesn't look broken.
  const chartPoints = useMemo(
    () => tapWeekTrend(daily.data ?? [], tapId, days),
    [daily.data, tapId, days],
  );

  if (tap.loading && !tap.data) return <LoadingBlock />;
  if (tap.error && !tap.data) {
    return <ErrorRetry message={tap.error} onRetry={() => void tap.reload()} />;
  }
  if (!tap.data) {
    return <EmptyState title="Tap not found" description={`No tap with id ${tapId}`} />;
  }

  const t = tap.data;
  const status = hostDevice?.status ?? "unknown";
  const pplValue = pplDraft || String(t.pulses_per_liter);
  const tapThreshold = thresholds.data?.taps?.[t.id];
  const thresholdLiters =
    !t.is_control && tapThreshold?.enabled ? tapThreshold.session_liters_threshold : null;

  async function saveCalibration(e: FormEvent) {
    e.preventDefault();
    const ppl = Number(pplValue);
    if (!Number.isFinite(ppl) || ppl <= 1) {
      push("Enter a valid pulses/L value", "danger");
      return;
    }
    setSaving(true);
    try {
      await apiFetch<Tap>(`/api/v1/taps/${t.id}/calibration`, {
        method: "PATCH",
        body: JSON.stringify({
          pulses_per_liter: ppl,
          note: "Phase 10 bucket calibration",
        }),
      });
      push("Calibration saved — also update firmware config.h", "ok");
      setPplDraft("");
      await tap.reload();
    } catch (err) {
      push(err instanceof Error ? err.message : "Save failed", "danger");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs text-muted">
            <Link href="/taps" className="text-brand hover:underline">
              Taps
            </Link>
            {" · "}
            {t.name}
          </p>
          <h1 className="mt-1 text-[28px] font-bold tracking-tight text-ink">{t.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {t.is_control ? <Badge kind="control">Control</Badge> : (
              <Badge kind="info">Intervention</Badge>
            )}
            <StatusDot
              status={
                status === "online" ? "online" : status === "stale" ? "stale" : "unknown"
              }
            />
          </div>
        </div>
        {hostDevice ? (
          <Link
            href={`/devices/${hostDevice.id}`}
            className="text-sm font-medium text-brand hover:underline"
          >
            Device · {hostDevice.name}
          </Link>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiStat label="Today" value={formatLiters(stats.todayL)} />
        <KpiStat label="This week" value={formatLiters(stats.weekL)} />
        <KpiStat label="Avg session" value={formatLiters(stats.avg)} />
        <KpiStat label="Long-tail sessions" value={String(stats.longTail)} />
      </div>

      <section className="rounded-xl border border-line bg-surface/90 p-4">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-ink">Daily usage</h2>
          <div className="flex gap-1">
            {[7, 14].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDays(d as 7 | 14)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs",
                  days === d
                    ? "border-brand bg-cyan-50 text-brand-strong"
                    : "border-line text-muted",
                )}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>
        <MiniBars points={chartPoints} thresholdLiters={thresholdLiters} />
        {!t.is_control ? (
          <p className="mt-3 text-xs text-muted">
            Phase 2 cue threshold:{" "}
            {thresholdLiters != null ? (
              <>
                {thresholdLiters.toFixed(2)} L · edit on{" "}
                <Link href="/thresholds" className="text-brand underline-offset-2 hover:underline">
                  Thresholds
                </Link>
              </>
            ) : (
              <>
                not set · configure on{" "}
                <Link href="/thresholds" className="text-brand underline-offset-2 hover:underline">
                  Thresholds
                </Link>
              </>
            )}
          </p>
        ) : (
          <p className="mt-3 text-xs text-muted">Control tap — never receives color cues.</p>
        )}
      </section>

      <section className="rounded-xl border border-line bg-surface/90 p-4">
        <h2 className="text-sm font-semibold text-ink">Calibration (Phase 10)</h2>
        <p className="mt-1 text-sm text-muted">
          After bucket test, save pulses/L here and mirror the same value in firmware{" "}
          <span className="mono">config.h</span>.
        </p>
        <form className="mt-4 flex flex-wrap items-end gap-3" onSubmit={saveCalibration}>
          <div>
            <Label htmlFor="ppl">Pulses per liter</Label>
            <Input
              id="ppl"
              className="mono w-40"
              value={pplValue}
              onChange={(e) => setPplDraft(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save calibration"}
          </Button>
        </form>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-ink">Recent sessions</h2>
        {(sessions.data ?? []).length === 0 ? (
          <EmptyState
            title="No sessions for this tap yet"
            description="Flow events will appear after ESP or simulate_ingest."
          />
        ) : (
          <DataTable headers={["Start", "End", "Duration", "Liters", "Flag"]}>
            {(sessions.data ?? []).map((s) => (
              <DataRow key={s.id}>
                <Td>{formatWhen(s.started_at)}</Td>
                <Td>{formatWhen(s.ended_at)}</Td>
                <Td mono>{formatDuration(s.duration_seconds)}</Td>
                <Td mono>{formatLiters(s.liters)}</Td>
                <Td>{s.is_long_tail ? <Badge kind="phase">long-tail</Badge> : "—"}</Td>
              </DataRow>
            ))}
          </DataTable>
        )}
      </section>
    </div>
  );
}
