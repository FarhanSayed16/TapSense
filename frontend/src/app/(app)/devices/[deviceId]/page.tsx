"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Badge, StatusDot } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorRetry, LoadingBlock } from "@/components/ui/QueryState";
import { useApiData } from "@/lib/useApiData";
import { Device, formatRelative, formatWhen, Tap } from "@/lib/types";

export default function DeviceDetailPage() {
  const params = useParams<{ deviceId: string }>();
  const id = params.deviceId;
  const device = useApiData<Device>(id ? `/api/v1/devices/${id}` : null, { refreshMs: 4000 });
  const taps = useApiData<Tap[]>("/api/v1/taps");

  if (device.loading && !device.data) return <LoadingBlock />;
  if (device.error && !device.data) {
    return <ErrorRetry message={device.error} onRetry={() => void device.reload()} />;
  }
  if (!device.data) {
    return <EmptyState title="Device not found" description={id} />;
  }

  const d = device.data;
  const bound = (taps.data ?? []).filter((t) => d.tap_ids.includes(t.id));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs text-muted">
          <Link href="/devices" className="text-brand hover:underline">
            Devices
          </Link>{" "}
          / {d.id}
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-ink">{d.name}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge kind={d.architecture === "single_tap" ? "phase" : "neutral"}>
            {d.architecture ?? "—"}
          </Badge>
          <StatusDot status={d.status} />
        </div>
      </div>

      <section className="rounded-xl border border-line bg-surface/90 p-4 text-sm">
        <dl className="grid gap-2 sm:grid-cols-2">
          <div>
            <dt className="text-muted">Firmware</dt>
            <dd className="mono text-ink">{d.firmware_version ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted">Last seen</dt>
            <dd className="text-ink">
              {formatWhen(d.last_seen_at)} · {formatRelative(d.last_seen_at)}
            </dd>
          </div>
          <div>
            <dt className="text-muted">MQTT topic</dt>
            <dd className="mono text-ink">{d.mqtt_topic ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted">WiFi RSSI</dt>
            <dd className="mono text-ink">{d.wifi_rssi ?? "—"}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-xl border border-line bg-surface/90 p-4 space-y-2">
        <h2 className="text-sm font-semibold text-ink">Bound taps</h2>
        {bound.length === 0 ? (
          <p className="text-sm text-muted">No taps bound.</p>
        ) : (
          bound.map((t) => (
            <Link
              key={t.id}
              href={`/taps/${t.id}`}
              className="flex items-center justify-between rounded-lg border border-line px-3 py-2 hover:border-brand/40"
            >
              <span>
                {t.name} {t.is_control ? <Badge kind="control">control</Badge> : null}
              </span>
              <span className="mono text-xs text-muted">{t.id}</span>
            </Link>
          ))
        )}
      </section>

      {d.architecture === "single_tap" ? (
        <p className="text-xs text-muted">
          Flash <code className="mono">tapsense_single_tap.ino</code> with DEVICE_ID=
          <span className="mono">{d.id}</span> and TAP_ID=
          <span className="mono">{d.tap_ids[0] ?? "?"}</span>.
        </p>
      ) : (
        <p className="text-xs text-muted">
          Legacy pilot multi-tap board — see <Link href="/device" className="text-brand hover:underline">Device</Link>{" "}
          (Wave-1 page) or migrate new taps to single_tap ESPs.
        </p>
      )}
    </div>
  );
}
