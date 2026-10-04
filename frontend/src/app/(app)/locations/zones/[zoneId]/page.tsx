"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { KpiStat } from "@/components/ui/KpiStat";
import { ErrorRetry, LoadingBlock } from "@/components/ui/QueryState";
import { useApiData } from "@/lib/useApiData";
import { formatLiters } from "@/lib/types";

type ZoneDash = {
  zone: { id: string; name: string; floor_id: string; building_id: string };
  taps: { id: string; name: string; is_control: boolean; device_id?: string }[];
  devices: { id: string; name: string; architecture?: string }[];
  metrics: { liters_today: number; tap_count: number };
};

export default function ZonePage() {
  const params = useParams<{ zoneId: string }>();
  const id = params.zoneId;
  const dash = useApiData<ZoneDash>(id ? `/api/v1/locations/zones/${id}` : null);

  if (dash.loading && !dash.data) return <LoadingBlock />;
  if (dash.error && !dash.data) {
    return <ErrorRetry message={dash.error} onRetry={() => void dash.reload()} />;
  }
  const d = dash.data!;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs text-muted">
          <Link href="/locations" className="text-brand hover:underline">
            Locations
          </Link>{" "}
          /{" "}
          <Link
            href={`/locations/floors/${d.zone.floor_id}`}
            className="text-brand hover:underline"
          >
            {d.zone.floor_id}
          </Link>{" "}
          / {d.zone.id}
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-ink">{d.zone.name}</h1>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <KpiStat label="Liters today" value={formatLiters(d.metrics.liters_today)} />
        <KpiStat label="Taps" value={String(d.metrics.tap_count)} />
      </div>
      <section className="rounded-xl border border-line bg-surface/90 p-4 space-y-2">
        <h2 className="text-sm font-semibold text-ink">Taps</h2>
        {d.taps.map((t) => (
          <Link
            key={t.id}
            href={`/taps/${t.id}`}
            className="flex items-center justify-between rounded-lg border border-line px-3 py-2 hover:border-brand/40"
          >
            <span>
              {t.name} {t.is_control ? <Badge kind="control">control</Badge> : null}
            </span>
            <span className="mono text-xs text-muted">{t.device_id ?? "unbound"}</span>
          </Link>
        ))}
      </section>
      <section className="rounded-xl border border-line bg-surface/90 p-4 space-y-2">
        <h2 className="text-sm font-semibold text-ink">Devices</h2>
        {d.devices.map((dev) => (
          <Link
            key={dev.id}
            href={`/devices/${dev.id}`}
            className="block rounded-lg border border-line px-3 py-2 hover:border-brand/40"
          >
            {dev.name}{" "}
            <span className="mono text-xs text-muted">
              {dev.id} · {dev.architecture ?? "—"}
            </span>
          </Link>
        ))}
      </section>
    </div>
  );
}
