"use client";

import Link from "next/link";
import { Radio, Wifi } from "lucide-react";
import { Badge, StatusDot } from "@/components/ui/Badge";
import { KpiStat } from "@/components/ui/KpiStat";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorRetry, LoadingBlock } from "@/components/ui/QueryState";
import { useApiData } from "@/lib/useApiData";
import { Device, formatWhen, formatRelative } from "@/lib/types";

export default function DevicesFleetPage() {
  const devices = useApiData<Device[]>("/api/v1/devices", { refreshMs: 5000 });

  if (devices.loading && !devices.data) return <LoadingBlock />;
  if (devices.error && !devices.data) {
    return <ErrorRetry message={devices.error} onRetry={() => void devices.reload()} />;
  }

  const list = devices.data ?? [];
  const online = list.filter((d) => d.status === "online").length;

  if (list.length === 0) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight text-ink">Devices</h1>
          <p className="mt-1 text-sm text-ink-secondary">ESP fleet registry and health monitoring.</p>
        </div>
        <EmptyState
          title="No devices registered"
          description="Connect an ESP device to the backend — it will appear here automatically."
          icon="device"
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[28px] font-bold tracking-tight text-ink">Devices</h1>
        <p className="mt-1 text-sm text-ink-secondary">ESP fleet registry and health monitoring.</p>
      </div>

      {/* Fleet KPIs */}
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiStat
          label="Total devices"
          value={String(list.length)}
          hint="Registered ESPs"
        />
        <KpiStat
          label="Online"
          value={String(online)}
          hint={`${list.length - online} offline`}
          trend={
            online === list.length
              ? { direction: "up" as const, text: "All healthy" }
              : { direction: "down" as const, text: "Check stale devices" }
          }
        />
        <KpiStat
          label="Total taps"
          value={String(list.reduce((sum, d) => sum + (d.tap_ids?.length ?? 0), 0))}
          hint="Bound across fleet"
        />
      </div>

      {/* Device Cards */}
      <div className="space-y-3">
        {list.map((d) => (
          <Link
            key={d.id}
            href={`/devices/${d.id}`}
            className="card card-interactive flex flex-wrap items-center justify-between gap-4 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-bg-subtle">
                <Radio className="h-5 w-5 text-brand" strokeWidth={1.75} />
              </div>
              <div>
                <p className="font-semibold text-ink">{d.name}</p>
                <p className="mt-1 text-sm text-ink-secondary">
                  {d.tap_ids?.length ?? 0} tap{(d.tap_ids?.length ?? 0) !== 1 ? "s" : ""} bound
                  {d.firmware_version ? ` · fw ${d.firmware_version}` : ""}
                  {d.wifi_rssi != null ? (
                    <span className="inline-flex items-center gap-1 ml-2">
                      <Wifi className="inline h-3.5 w-3.5 text-muted" />
                      <span className="mono text-xs">{d.wifi_rssi} dBm</span>
                    </span>
                  ) : null}
                </p>
                <p className="mt-1 text-xs text-muted">
                  Last seen {formatRelative(d.last_seen_at)}
                  {d.last_seen_at ? ` · ${formatWhen(d.last_seen_at)}` : ""}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge kind="neutral">
                {d.tap_ids?.length ?? 0} tap{(d.tap_ids?.length ?? 0) !== 1 ? "s" : ""}
              </Badge>
              <StatusDot status={d.status} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
