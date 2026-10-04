"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Droplets, Shield } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { DataRow, DataTable, Td } from "@/components/ui/DataTable";
import { MiniBars } from "@/components/ui/MiniBars";
import { ErrorRetry, LoadingBlock } from "@/components/ui/QueryState";
import { cn } from "@/lib/cn";
import { useApiData } from "@/lib/useApiData";
import {
  DailyAggregate,
  Device,
  formatLiters,
  formatRelative,
  Tap,
  tapWeekTrend,
} from "@/lib/types";

type Filter = "all" | "control" | "intervention";

export default function TapsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");
  const taps = useApiData<Tap[]>("/api/v1/taps");
  const daily = useApiData<DailyAggregate[]>("/api/v1/aggregates/daily?days=7");
  const devices = useApiData<Device[]>("/api/v1/devices", { refreshMs: 5000 });

  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  const weekStart = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  })();

  const deviceById = useMemo(() => {
    const map = new Map<string, Device>();
    for (const d of devices.data ?? []) map.set(d.id, d);
    return map;
  }, [devices.data]);

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
      const spark = tapWeekTrend(daily.data ?? [], tap.id, 7);
      const lastSeen = deviceById.get(tap.device_id)?.last_seen_at ?? null;
      return { tap, todayL, weekL, spark, lastSeen };
    });
  }, [taps.data, daily.data, filter, today, weekStart, deviceById]);

  if (taps.loading && !taps.data) return <LoadingBlock />;
  if (taps.error && !taps.data) {
    return <ErrorRetry message={taps.error} onRetry={() => void taps.reload()} />;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[28px] font-bold tracking-tight text-ink">Taps</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Compare control vs intervention taps across your pilot.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["all", "control", "intervention"] as Filter[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-full px-4 py-2 text-xs font-semibold capitalize transition-all duration-150",
              filter === f
                ? "bg-brand text-white shadow-sm"
                : "bg-surface text-ink-secondary border border-line hover:bg-bg-subtle",
            )}
          >
            {f}
          </button>
        ))}
      </div>

      <DataTable headers={["Tap", "Role", "Today", "This Week", "Trend", "Last Seen"]}>
        {rows.map(({ tap, todayL, weekL, spark, lastSeen }) => (
          <DataRow key={tap.id} onClick={() => router.push(`/taps/${tap.id}`)}>
            <Td>
              <div className="flex items-center gap-2.5">
                {tap.is_control ? (
                  <Shield className="h-4 w-4 text-control" strokeWidth={1.75} />
                ) : (
                  <Droplets className="h-4 w-4 text-brand" strokeWidth={1.75} />
                )}
                <span className="font-semibold text-ink">{tap.name}</span>
              </div>
            </Td>
            <Td>
              {tap.is_control ? (
                <Badge kind="control">Control</Badge>
              ) : (
                <Badge kind="info">Intervention</Badge>
              )}
            </Td>
            <Td mono align="right">{formatLiters(todayL)}</Td>
            <Td mono align="right">{formatLiters(weekL)}</Td>
            <Td>
              <div className="w-28">
                <MiniBars points={spark} compact />
              </div>
            </Td>
            <Td>{formatRelative(lastSeen)}</Td>
          </DataRow>
        ))}
      </DataTable>
    </div>
  );
}
