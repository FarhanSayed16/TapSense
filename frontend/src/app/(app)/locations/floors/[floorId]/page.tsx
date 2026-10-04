"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { KpiStat } from "@/components/ui/KpiStat";
import { ErrorRetry, LoadingBlock } from "@/components/ui/QueryState";
import { useApiData } from "@/lib/useApiData";
import { formatLiters } from "@/lib/types";

type FloorDash = {
  floor: { id: string; name: string; building_id: string };
  zones: { id: string; name: string }[];
  taps: { id: string; name: string; is_control: boolean; device_id?: string }[];
  metrics: { liters_today: number; tap_count: number; zone_count: number };
};

export default function FloorPage() {
  const params = useParams<{ floorId: string }>();
  const id = params.floorId;
  const dash = useApiData<FloorDash>(id ? `/api/v1/locations/floors/${id}` : null);

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
            href={`/locations/buildings/${d.floor.building_id}`}
            className="text-brand hover:underline"
          >
            {d.floor.building_id}
          </Link>{" "}
          / {d.floor.id}
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-ink">{d.floor.name}</h1>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <KpiStat label="Liters today" value={formatLiters(d.metrics.liters_today)} />
        <KpiStat label="Zones" value={String(d.metrics.zone_count)} />
        <KpiStat label="Taps" value={String(d.metrics.tap_count)} />
      </div>
      <section className="rounded-xl border border-line bg-surface/90 p-4 space-y-2">
        {d.zones.map((z) => (
          <Link
            key={z.id}
            href={`/locations/zones/${z.id}`}
            className="block rounded-lg border border-line px-3 py-2 hover:border-brand/40"
          >
            {z.name} <span className="mono text-xs text-muted">{z.id}</span>
          </Link>
        ))}
        {d.taps.map((t) => (
          <Link
            key={t.id}
            href={`/taps/${t.id}`}
            className="flex items-center justify-between rounded-lg border border-line px-3 py-2 hover:border-brand/40"
          >
            <span>
              {t.name}{" "}
              {t.is_control ? <Badge kind="control">control</Badge> : null}
            </span>
            <span className="mono text-xs text-muted">{t.device_id}</span>
          </Link>
        ))}
      </section>
    </div>
  );
}
