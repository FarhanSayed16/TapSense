"use client";

import { useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { DataRow, DataTable, Td } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { Label } from "@/components/ui/Input";
import { ErrorRetry, LoadingBlock } from "@/components/ui/QueryState";
import { cn } from "@/lib/cn";
import { useApiData } from "@/lib/useApiData";
import {
  formatDuration,
  formatLiters,
  formatRelative,
  formatWhen,
  Session,
  Tap,
  tapLabel,
} from "@/lib/types";

function durationTone(seconds: number | null | undefined): string {
  if (seconds == null || !Number.isFinite(seconds)) return "text-muted";
  if (seconds < 45) return "text-ok";
  if (seconds < 180) return "text-warn";
  return "text-danger";
}

export default function SessionsPage() {
  const [tapId, setTapId] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const taps = useApiData<Tap[]>("/api/v1/taps");
  const path =
    tapId === "all"
      ? "/api/v1/sessions?limit=100"
      : `/api/v1/sessions?tap_id=${tapId}&limit=100`;
  const sessions = useApiData<Session[]>(path, { refreshMs: 4000 });

  const filtered = useMemo(() => {
    return (sessions.data ?? []).filter((s) => {
      const start = new Date(s.started_at).getTime();
      if (from) {
        const fromTs = new Date(from).getTime();
        if (start < fromTs) return false;
      }
      if (to) {
        const toTs = new Date(to).getTime() + 24 * 60 * 60 * 1000 - 1;
        if (start > toTs) return false;
      }
      return true;
    });
  }, [sessions.data, from, to]);

  if (sessions.loading && !sessions.data) return <LoadingBlock />;
  if (sessions.error && !sessions.data) {
    return (
      <ErrorRetry message={sessions.error} onRetry={() => void sessions.reload()} />
    );
  }

  const tapList = taps.data ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[28px] font-bold tracking-tight text-ink">Sessions</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Chronological flow events — tap-level only, never person-linked.
        </p>
      </div>

      <div className="card p-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="tap">Tap</Label>
            <select
              id="tap"
              className="min-h-12 w-full rounded-xl border border-line bg-surface px-4 text-sm text-ink outline-none transition-all duration-150 focus:border-brand focus:ring-2 focus:ring-brand/20"
              value={tapId}
              onChange={(e) => setTapId(e.target.value)}
            >
              <option value="all">All taps</option>
              {tapList.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="from">From</Label>
            <input
              id="from"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="min-h-12 w-full rounded-xl border border-line bg-surface px-4 text-sm text-ink outline-none transition-all duration-150 focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>
          <div>
            <Label htmlFor="to">To</Label>
            <input
              id="to"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="min-h-12 w-full rounded-xl border border-line bg-surface px-4 text-sm text-ink outline-none transition-all duration-150 focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No sessions match your filters"
          description="Try adjusting the date range, or open a faucet during the demo."
          icon="water"
        />
      ) : (
        <DataTable
          headers={["When", "Tap", "Liters", "Duration", "Status", ""]}
        >
          {filtered.map((s) => (
            <DataRow key={s.id}>
              <Td>
                <div className="flex flex-col">
                  <span className="text-ink">{formatWhen(s.started_at)}</span>
                  <span className="text-xs text-muted">{formatRelative(s.started_at)}</span>
                </div>
              </Td>
              <Td>
                <span className="font-medium">{tapLabel(tapList, s.tap_id)}</span>
              </Td>
              <Td mono align="right">{formatLiters(s.liters)}</Td>
              <Td align="right">
                <span className={cn("mono text-sm font-medium", durationTone(s.duration_seconds))}>
                  {s.ended_at ? formatDuration(s.duration_seconds) : "in progress"}
                </span>
              </Td>
              <Td>
                {s.ended_at ? (
                  <span className="text-muted">Ended</span>
                ) : (
                  <Badge kind="status">Flowing</Badge>
                )}
              </Td>
              <Td>
                {s.is_long_tail ? (
                  <span
                    className="inline-flex items-center gap-1 text-warn"
                    title="Long-tail session — unusually long open flow"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    <span className="sr-only">Long-tail</span>
                  </span>
                ) : (
                  <span className="text-muted">—</span>
                )}
              </Td>
            </DataRow>
          ))}
        </DataTable>
      )}
    </div>
  );
}
