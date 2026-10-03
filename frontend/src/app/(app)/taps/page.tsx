"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { DataRow, DataTable, Td } from "@/components/ui/DataTable";
import { ErrorRetry, LoadingBlock } from "@/components/ui/QueryState";
import { cn } from "@/lib/cn";
import { useApiData } from "@/lib/useApiData";
import {
  DailyAggregate,
  Device,
  formatLiters,
  formatWhen,
  Tap,
} from "@/lib/types";

type Filter = "all" | "control" | "intervention";

export default function TapsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");
  const taps = useApiData<Tap[]>("/api/v1/taps");
  const daily = useApiData<DailyAggregate[]>("/api/v1/aggregates/daily?days=7");
  const device = useApiData<Device>("/api/v1/devices/device_01");

  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  const weekStart = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  })();

  const rows = useMemo(() => {
    const list = (taps.data ?? []).filter((t) => {
      if (filter === "control") return t.is_control;
      if (filter === "intervention") return !t.is_control;
      return true;
    });
    return list.map((tap) => {
      let todayL = 0;
      let weekL = 0;
      for (const row of daily.data ?? []) {
        if (row.tap_id !== tap.id) continue;
        if (row.date === today) todayL += row.liters;
        if (row.date >= weekStart) weekL += row.liters;
      }
      return { tap, todayL, weekL };
    });
  }, [taps.data, daily.data, filter, today, weekStart]);

  if (taps.loading && !taps.data) return <LoadingBlock />;
  if (taps.error && !taps.data) {
    return <ErrorRetry message={taps.error} onRetry={() => void taps.reload()} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Taps</h1>
        <p className="mt-1 text-sm text-muted">Compare control vs intervention taps.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["all", "control", "intervention"] as Filter[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium capitalize",
              filter === f
                ? "border-brand bg-cyan-50 text-brand-strong"
                : "border-line bg-surface text-muted",
            )}
          >
            {f}
          </button>
        ))}
      </div>

      <DataTable headers={["Tap", "Role", "Today L", "Week L", "Last seen"]}>
        {rows.map(({ tap, todayL, weekL }) => (
          <DataRow key={tap.id} onClick={() => router.push(`/taps/${tap.id}`)}>
            <Td>
              <div>
                <p className="font-medium">{tap.name}</p>
                <p className="mono text-xs text-muted">{tap.id}</p>
              </div>
            </Td>
            <Td>
              {tap.is_control ? (
                <Badge kind="control">control</Badge>
              ) : (
                <Badge kind="neutral">intervention</Badge>
              )}
            </Td>
            <Td mono>{formatLiters(todayL)}</Td>
            <Td mono>{formatLiters(weekL)}</Td>
            <Td>{formatWhen(device.data?.last_seen_at)}</Td>
          </DataRow>
        ))}
      </DataTable>
    </div>
  );
}
