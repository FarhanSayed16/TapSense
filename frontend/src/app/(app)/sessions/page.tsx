"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { DataRow, DataTable, Td } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input, Label } from "@/components/ui/Input";
import { ErrorRetry, LoadingBlock } from "@/components/ui/QueryState";
import { useApiData } from "@/lib/useApiData";
import {
  formatDuration,
  formatLiters,
  formatWhen,
  Session,
  Tap,
} from "@/lib/types";

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Sessions</h1>
        <p className="mt-1 text-sm text-muted">
          Chronological flow events across taps — tap-level only, never person-linked.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <Label htmlFor="tap">Tap</Label>
          <select
            id="tap"
            className="min-h-11 w-full rounded-lg border border-line bg-surface px-3 text-sm"
            value={tapId}
            onChange={(e) => setTapId(e.target.value)}
          >
            <option value="all">All taps</option>
            {(taps.data ?? []).map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="from">From</Label>
          <Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="to">To</Label>
          <Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No sessions in this range"
          description="Early Phase 0 days can be quiet — or widen the filters / run simulate_ingest."
        />
      ) : (
        <DataTable
          headers={["Start", "End", "Duration", "Liters", "Tap", "Long-tail"]}
        >
          {filtered.map((s) => (
            <DataRow key={s.id}>
              <Td>{formatWhen(s.started_at)}</Td>
              <Td>{formatWhen(s.ended_at)}</Td>
              <Td mono>{formatDuration(s.duration_seconds)}</Td>
              <Td mono>{formatLiters(s.liters)}</Td>
              <Td mono>{s.tap_id}</Td>
              <Td>
                {s.is_long_tail ? <Badge kind="phase">yes</Badge> : "—"}
              </Td>
            </DataRow>
          ))}
        </DataTable>
      )}
    </div>
  );
}
