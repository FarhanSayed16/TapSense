"use client";

import Link from "next/link";
import { useState } from "react";
import { DateWindowFields } from "@/components/science/DateWindowFields";
import { HonestyBanner } from "@/components/science/HonestyBanner";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataRow, DataTable, Td } from "@/components/ui/DataTable";
import { ApiError, apiFetch } from "@/lib/api";
import { campusToday, daysAgo } from "@/lib/science";
import { formatLiters } from "@/lib/types";

type SplitResponse = {
  start: string;
  end: string;
  timezone: string;
  honesty: string;
  split: {
    control: {
      mean_liters_per_day: number;
      mean_session_liters: number;
      long_tail_session_pct: number;
      n_taps: number;
    };
    intervention: {
      mean_liters_per_day: number;
      mean_session_liters: number;
      long_tail_session_pct: number;
      n_taps: number;
    };
  };
  overall: Record<string, number>;
  per_tap: Record<
    string,
    {
      name: string;
      is_control: boolean;
      mean_liters_per_day: number;
      mean_session_liters: number;
      long_tail_session_pct: number;
      session_count: number;
    }
  >;
};

export default function ControlPage() {
  const [start, setStart] = useState(daysAgo(7));
  const [end, setEnd] = useState(campusToday());
  const [data, setData] = useState<SplitResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setBusy(true);
    setError(null);
    setData(null);
    try {
      const result = await apiFetch<SplitResponse>(
        `/api/v1/analytics/control-vs-intervention?start=${start}&end=${end}`,
      );
      setData(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Split failed");
    } finally {
      setBusy(false);
    }
  };

  const sessions =
    data?.overall?.closed_sessions != null ? Number(data.overall.closed_sessions) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Control</h1>
        <p className="mt-1 text-sm text-muted">
          Tap A (control) vs Tap B/C (intervention) for one campus date window. Descriptive only —
          not a powered RCT.
        </p>
      </div>

      <HonestyBanner
        text="Descriptive pilot split — not a powered RCT."
        sampleHint={
          sessions != null
            ? `pilot N = ${sessions} closed sessions · ${data?.timezone ?? "Asia/Kolkata"}`
            : "Choose a window that matches a tagged phase on Phases"
        }
      />

      <section className="rounded-xl border border-line bg-surface/90 p-5 space-y-4">
        <DateWindowFields start={start} end={end} onStart={setStart} onEnd={setEnd} />
        <div className="flex flex-wrap gap-2">
          <Button disabled={busy} onClick={() => void run()}>
            Run control vs intervention
          </Button>
          <Link
            href="/phases"
            className="inline-flex min-h-11 items-center rounded-lg border border-line px-4 text-sm font-medium text-ink hover:bg-white/70"
          >
            Phase dates
          </Link>
          <Link
            href="/compare"
            className="inline-flex min-h-11 items-center rounded-lg border border-line px-4 text-sm font-medium text-ink hover:bg-white/70"
          >
            Phase compare
          </Link>
        </div>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
      </section>

      {data ? (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                ["Control (Tap A)", data.split.control, "control"],
                ["Intervention (B/C)", data.split.intervention, "neutral"],
              ] as const
            ).map(([label, cohort, kind]) => (
              <div key={label} className="rounded-xl border border-line bg-surface/90 p-4">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-ink">{label}</p>
                  <Badge kind={kind}>{cohort.n_taps} taps</Badge>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <dt className="text-muted">Mean L/day</dt>
                    <dd className="font-medium text-ink">
                      {formatLiters(cohort.mean_liters_per_day)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted">Mean session</dt>
                    <dd className="font-medium text-ink">
                      {formatLiters(cohort.mean_session_liters)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted">Long-tail %</dt>
                    <dd className="font-medium text-ink">
                      {cohort.long_tail_session_pct.toFixed(1)}%
                    </dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>

          <DataTable headers={["Tap", "Role", "L/day", "Session", "Long-tail", "Sessions"]}>
            {Object.entries(data.per_tap).map(([tid, row]) => (
              <DataRow key={tid}>
                <Td>
                  <span className="font-medium text-ink">{row.name}</span>
                  <span className="mono ml-2 text-xs text-muted">{tid}</span>
                </Td>
                <Td>
                  {row.is_control ? (
                    <Badge kind="control">control</Badge>
                  ) : (
                    <Badge kind="neutral">intervention</Badge>
                  )}
                </Td>
                <Td className="text-sm">{formatLiters(row.mean_liters_per_day)}</Td>
                <Td className="text-sm">{formatLiters(row.mean_session_liters)}</Td>
                <Td className="text-sm">{row.long_tail_session_pct.toFixed(1)}%</Td>
                <Td className="mono text-sm text-muted">{row.session_count}</Td>
              </DataRow>
            ))}
          </DataTable>
        </div>
      ) : null}
    </div>
  );
}
