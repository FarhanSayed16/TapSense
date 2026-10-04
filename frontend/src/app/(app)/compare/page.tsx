"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { GitCompareArrows } from "lucide-react";
import { HonestyBanner } from "@/components/science/HonestyBanner";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataRow, DataTable, Td } from "@/components/ui/DataTable";
import { Label } from "@/components/ui/Input";
import { ErrorRetry, LoadingBlock } from "@/components/ui/QueryState";
import { ApiError, apiFetch } from "@/lib/api";
import { fmtPct, fmtPp, PHASE_OPTIONS } from "@/lib/science";
import { useApiData } from "@/lib/useApiData";
import { formatLiters, PhaseCompare, PhaseWindows } from "@/lib/types";

export default function ComparePage() {
  const windows = useApiData<PhaseWindows>("/api/v1/phase-windows");
  const [phaseA, setPhaseA] = useState(0);
  const [phaseB, setPhaseB] = useState(1);
  const [compare, setCompare] = useState<PhaseCompare | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tagged = useMemo(() => {
    const w = windows.data?.windows ?? {};
    return {
      a: Boolean(w[String(phaseA)]?.start && w[String(phaseA)]?.end),
      b: Boolean(w[String(phaseB)]?.start && w[String(phaseB)]?.end),
    };
  }, [windows.data, phaseA, phaseB]);

  const run = async () => {
    setBusy(true);
    setError(null);
    setCompare(null);
    try {
      const qs = new URLSearchParams({
        phase_a: String(phaseA),
        phase_b: String(phaseB),
      });
      const result = await apiFetch<PhaseCompare>(`/api/v1/analytics/compare?${qs}`);
      setCompare(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Compare failed");
    } finally {
      setBusy(false);
    }
  };

  if (windows.loading && !windows.data) return <LoadingBlock />;
  if (windows.error && !windows.data) {
    return <ErrorRetry message={windows.error} onRetry={() => void windows.reload()} />;
  }

  const sampleA = compare
    ? Object.values(compare.per_tap_delta).reduce((n, r) => n + (r.session_count.a || 0), 0)
    : 0;
  const sampleB = compare
    ? Object.values(compare.per_tap_delta).reduce((n, r) => n + (r.session_count.b || 0), 0)
    : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[28px] font-bold tracking-tight text-ink">Compare</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Phase deltas for liters/day, session size, and long-tail share.{" "}
          <Link href="/phases" className="font-medium text-brand hover:text-brand-strong">
            Set dates on Phases →
          </Link>
        </p>
      </div>

      <HonestyBanner
        text="Pilot N is small — treat deltas as descriptive, not powered causal proof."
        sampleHint={
          compare
            ? `N = ${sampleA} sessions (A) vs ${sampleB} sessions (B) · ${compare.timezone}`
            : undefined
        }
      />

      {/* ── Phase Selector ── */}
      <section className="card p-6 space-y-5">
        <div className="flex items-center gap-2.5">
          <GitCompareArrows className="h-5 w-5 text-brand" />
          <h2 className="text-base font-semibold text-ink">Select Phases</h2>
        </div>
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <Label htmlFor="pa">Phase A (before)</Label>
            <select
              id="pa"
              className="min-h-12 w-full rounded-xl border border-line bg-surface px-4 text-sm text-ink outline-none transition-all duration-150 focus:border-brand focus:ring-2 focus:ring-brand/20"
              value={phaseA}
              onChange={(e) => setPhaseA(Number(e.target.value))}
            >
              {PHASE_OPTIONS.map((p) => {
                const w = windows.data?.windows?.[String(p)];
                return (
                  <option key={p} value={p}>
                    Phase {p}
                    {w?.start && w?.end ? ` · ${w.start} → ${w.end}` : " · unset"}
                  </option>
                );
              })}
            </select>
          </div>
          <div>
            <Label htmlFor="pb">Phase B (after)</Label>
            <select
              id="pb"
              className="min-h-12 w-full rounded-xl border border-line bg-surface px-4 text-sm text-ink outline-none transition-all duration-150 focus:border-brand focus:ring-2 focus:ring-brand/20"
              value={phaseB}
              onChange={(e) => setPhaseB(Number(e.target.value))}
            >
              {PHASE_OPTIONS.map((p) => {
                const w = windows.data?.windows?.[String(p)];
                return (
                  <option key={p} value={p}>
                    Phase {p}
                    {w?.start && w?.end ? ` · ${w.start} → ${w.end}` : " · unset"}
                  </option>
                );
              })}
            </select>
          </div>
          <Button disabled={busy || !tagged.a || !tagged.b} onClick={() => void run()}>
            Compare
          </Button>
        </div>
        {!tagged.a || !tagged.b ? (
          <p className="text-sm text-ink-secondary">
            Both phases need start/end dates.{" "}
            <Link href="/phases" className="font-medium text-brand hover:text-brand-strong">
              Set them on Phases
            </Link>
          </p>
        ) : null}
        {error ? <p className="text-sm text-danger">{error}</p> : null}
      </section>

      {/* ── Results ── */}
      {compare ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {[compare.phase_a, compare.phase_b].map((side) => (
              <div key={side.phase} className="card p-5">
                <Badge kind="phase">{side.label}</Badge>
                <p className="mt-2 text-sm text-ink-secondary">
                  {side.start} → {side.end}
                </p>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-xs uppercase tracking-wider text-muted">Intervention L/day</dt>
                    <dd className="kpi-value mt-1 text-lg text-ink">
                      {formatLiters(side.intervention.mean_liters_per_day)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wider text-muted">Control L/day</dt>
                    <dd className="kpi-value mt-1 text-lg text-ink">
                      {formatLiters(side.control.mean_liters_per_day)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wider text-muted">Mean session (B/C)</dt>
                    <dd className="kpi-value mt-1 text-lg text-ink">
                      {formatLiters(side.intervention.mean_session_liters)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wider text-muted">Long-tail % (B/C)</dt>
                    <dd className="kpi-value mt-1 text-lg text-ink">
                      {side.intervention.long_tail_session_pct.toFixed(1)}%
                    </dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>

          <DataTable headers={["Tap", "Δ L/day", "Δ Session", "Δ Long-tail", "Sessions A→B"]}>
            {Object.entries(compare.per_tap_delta).map(([tid, row]) => (
              <DataRow key={tid}>
                <Td>
                  <span className="font-semibold text-ink">{row.name}</span>
                  {row.is_control ? (
                    <Badge kind="control" className="ml-2">Control</Badge>
                  ) : (
                    <Badge kind="info" className="ml-2">Intervention</Badge>
                  )}
                </Td>
                <Td mono align="right">{fmtPct(row.mean_liters_per_day.delta_pct)}</Td>
                <Td mono align="right">{fmtPct(row.mean_session_liters.delta_pct)}</Td>
                <Td mono align="right">{fmtPp(row.long_tail_session_pct.delta_pp)}</Td>
                <Td mono align="right">
                  {row.session_count.a} → {row.session_count.b}
                </Td>
              </DataRow>
            ))}
          </DataTable>
        </div>
      ) : null}
    </div>
  );
}
