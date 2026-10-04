"use client";

import Link from "next/link";
import { Badge, StatusDot } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { KpiStat } from "@/components/ui/KpiStat";
import { ErrorRetry, LoadingBlock } from "@/components/ui/QueryState";
import { useApiData } from "@/lib/useApiData";
import { Device, formatRelative, formatWhen, Tap } from "@/lib/types";

export default function DevicePage() {
  const device = useApiData<Device>("/api/v1/devices/device_01", { refreshMs: 3000 });
  const taps = useApiData<Tap[]>("/api/v1/taps");

  if (device.loading && !device.data) return <LoadingBlock />;
  if (device.error && !device.data) {
    return <ErrorRetry message={device.error} onRetry={() => void device.reload()} />;
  }
  if (!device.data) {
    return (
      <EmptyState
        title="Device not seeded"
        description="Run backend seed so device_01 exists."
      />
    );
  }

  const d = device.data;
  const bound = (taps.data ?? []).filter((t) => d.tap_ids.includes(t.id));
  const rssiHint =
    d.wifi_rssi == null
      ? "Waiting for status telemetry"
      : d.wifi_rssi > -60
        ? "Strong"
        : d.wifi_rssi > -75
          ? "OK"
          : "Weak";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Device</h1>
          <p className="mt-1 text-sm text-muted">{d.name} · ESP32 washroom pilot</p>
        </div>
        <StatusDot
          status={d.status === "online" ? "online" : d.status === "stale" ? "stale" : "unknown"}
        />
      </div>

      {d.status === "online" ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <strong>Online</strong> — last seen {formatRelative(d.last_seen_at)} ({formatWhen(d.last_seen_at)}).
          Telemetry path ESP → Wi‑Fi → API is healthy.
        </div>
      ) : (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-warn">
          Device is <strong>{d.status}</strong>
          {d.last_seen_at
            ? ` (last seen ${formatWhen(d.last_seen_at)})`
            : " (no telemetry received yet)"}
          . Confirm power and washroom Wi‑Fi — no remote reboot in MVP.
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiStat label="Device ID" value={d.id} />
        <KpiStat label="Status" value={d.status} hint={formatRelative(d.last_seen_at)} />
        <KpiStat
          label="Wi‑Fi RSSI"
          value={d.wifi_rssi != null ? String(d.wifi_rssi) : "—"}
          hint={rssiHint}
        />
        <KpiStat label="Firmware" value={d.firmware_version ?? "—"} />
      </div>

      <section className="rounded-xl border border-line bg-surface/90 p-4">
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-sm font-semibold text-ink">Bound taps</h2>
        </div>
        <ul className="space-y-2">
          {bound.map((t) => (
            <li
              key={t.id}
              className="flex items-center justify-between rounded-lg border border-line bg-white/70 px-3 py-2"
            >
              <div>
                <Link href={`/taps/${t.id}`} className="font-medium text-ink hover:text-brand">
                  {t.name}
                </Link>
                <p className="mono text-xs text-muted">{t.id}</p>
              </div>
              {t.is_control ? (
                <Badge kind="control">Control</Badge>
              ) : (
                <Badge kind="neutral">Intervention</Badge>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
