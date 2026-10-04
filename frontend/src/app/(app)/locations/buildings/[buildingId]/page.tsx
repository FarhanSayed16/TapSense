"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Badge, StatusDot } from "@/components/ui/Badge";
import { KpiStat } from "@/components/ui/KpiStat";
import { ErrorRetry, LoadingBlock } from "@/components/ui/QueryState";
import { useScale } from "@/lib/scale-context";
import { useApiData } from "@/lib/useApiData";
import { formatLiters } from "@/lib/types";

type BuildingDash = {
  building: { id: string; name: string };
  floors: { id: string; name: string }[];
  zones: { id: string; name: string; floor_id: string }[];
  taps: { id: string; name: string; is_control: boolean }[];
  devices: {
    id: string;
    name: string;
    architecture: string;
    status: "online" | "stale" | "unknown";
    firmware_version?: string;
    tap_ids: string[];
  }[];
  metrics: {
    liters_today: number;
    liters_week: number;
    tap_count: number;
    zone_count: number;
    devices_online: number;
    devices_total: number;
  };
};

export default function BuildingPage() {
  const params = useParams<{ buildingId: string }>();
  const id = params.buildingId;
  const dash = useApiData<BuildingDash>(id ? `/api/v1/locations/buildings/${id}` : null);
  const { setBuildingId } = useScale();

  if (dash.loading && !dash.data) return <LoadingBlock />;
  if (dash.error && !dash.data) {
    return <ErrorRetry message={dash.error} onRetry={() => void dash.reload()} />;
  }

  const d = dash.data!;
  const m = d.metrics;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs text-muted">
            <Link href="/locations" className="text-brand hover:underline">
              Locations
            </Link>{" "}
            / {d.building.id}
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-ink">{d.building.name}</h1>
        </div>
        <button
          type="button"
          onClick={() => setBuildingId(d.building.id)}
          className="rounded-md border border-line px-3 py-1.5 text-xs font-medium text-ink hover:border-brand/40"
        >
          Use as context
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiStat label="Liters today" value={formatLiters(m.liters_today)} />
        <KpiStat label="Liters week" value={formatLiters(m.liters_week)} />
        <KpiStat label="Taps" value={String(m.tap_count)} hint={`${m.zone_count} zones`} />
        <KpiStat
          label="Devices online"
          value={`${m.devices_online}/${m.devices_total}`}
        />
      </div>

      <section className="rounded-xl border border-line bg-surface/90 p-4">
        <h2 className="text-sm font-semibold text-ink">Floors &amp; zones</h2>
        <ul className="mt-3 space-y-2">
          {d.floors.map((f) => (
            <li key={f.id}>
              <Link href={`/locations/floors/${f.id}`} className="font-medium text-brand hover:underline">
                {f.name}
              </Link>
              <span className="ml-2 text-xs text-muted">
                {d.zones.filter((z) => z.floor_id === f.id).map((z) => z.name).join(", ") || "no zones"}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-line bg-surface/90 p-4">
        <h2 className="mb-3 text-sm font-semibold text-ink">Devices</h2>
        <div className="space-y-2">
          {d.devices.map((dev) => (
            <Link
              key={dev.id}
              href={`/devices/${dev.id}`}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line px-3 py-2 hover:border-brand/40"
            >
              <div>
                <p className="font-medium text-ink">{dev.name}</p>
                <p className="mono text-xs text-muted">
                  {dev.id} · {dev.architecture} · fw {dev.firmware_version ?? "—"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge kind="neutral">{dev.tap_ids.length} taps</Badge>
                <StatusDot status={dev.status} />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
