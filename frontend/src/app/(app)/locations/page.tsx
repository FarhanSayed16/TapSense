"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { ErrorRetry, LoadingBlock } from "@/components/ui/QueryState";
import { useScale } from "@/lib/scale-context";
import { useApiData } from "@/lib/useApiData";

type Tree = {
  org: { id: string; name: string };
  campuses: {
    id: string;
    name: string;
    buildings: {
      id: string;
      name: string;
      floor_count: number;
      floors: {
        id: string;
        name: string;
        zone_count: number;
        zones: {
          id: string;
          name: string;
          tap_count: number;
          taps: {
            id: string;
            name: string;
            is_control: boolean;
            device_id: string;
            architecture: string;
          }[];
        }[];
      }[];
    }[];
  }[];
  summary: {
    buildings: number;
    floors: number;
    zones: number;
    taps: number;
    devices: number;
    control_taps: number;
    single_tap_devices: number;
  };
};

export default function LocationsPage() {
  const tree = useApiData<Tree>("/api/v1/locations/tree");
  const { buildingId, setBuildingId } = useScale();

  if (tree.loading && !tree.data) return <LoadingBlock />;
  if (tree.error && !tree.data) {
    return <ErrorRetry message={tree.error} onRetry={() => void tree.reload()} />;
  }

  const s = tree.data!.summary;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Locations</h1>
        <p className="mt-1 text-sm text-muted">
          Org → campus → building → floor → zone → tap. Wave-2 prefers 1 ESP per tap for new
          installs.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge kind="neutral">{s.buildings} buildings</Badge>
        <Badge kind="neutral">{s.floors} floors</Badge>
        <Badge kind="neutral">{s.zones} zones</Badge>
        <Badge kind="neutral">{s.taps} taps</Badge>
        <Badge kind="neutral">{s.devices} devices</Badge>
        <Badge kind="phase">{s.single_tap_devices} single-tap ESPs</Badge>
        <Badge kind="control">{s.control_taps} control</Badge>
      </div>

      {tree.data!.campuses.map((campus) => (
        <section key={campus.id} className="space-y-3">
          <h2 className="text-sm font-semibold text-ink">
            {campus.name}{" "}
            <span className="mono text-xs font-normal text-muted">{campus.id}</span>
          </h2>
          {campus.buildings.map((building) => (
            <div
              key={building.id}
              className={`rounded-xl border p-4 ${
                buildingId === building.id ? "border-brand bg-cyan-50/40" : "border-line bg-surface/90"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium text-ink">{building.name}</p>
                  <p className="mono text-xs text-muted">{building.id}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setBuildingId(building.id)}
                    className="rounded-md border border-line px-3 py-1.5 text-xs font-medium text-ink hover:border-brand/40"
                  >
                    {buildingId === building.id ? "Context active" : "Set context"}
                  </button>
                  <Link
                    href={`/locations/buildings/${building.id}`}
                    className="rounded-md border border-line px-3 py-1.5 text-xs font-medium text-ink hover:border-brand/40"
                  >
                    Dashboard
                  </Link>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                {building.floors.map((floor) => (
                  <div key={floor.id} className="rounded-lg border border-line bg-white/70 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium text-ink">
                        {floor.name}{" "}
                        <span className="mono text-xs text-muted">{floor.id}</span>
                      </p>
                      <Link
                        href={`/locations/floors/${floor.id}`}
                        className="text-xs text-brand hover:underline"
                      >
                        Floor view
                      </Link>
                    </div>
                    <ul className="mt-2 space-y-2">
                      {floor.zones.map((zone) => (
                        <li key={zone.id} className="text-sm">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-ink">
                              {zone.name}{" "}
                              <span className="mono text-xs text-muted">{zone.id}</span>
                            </span>
                            <Link
                              href={`/locations/zones/${zone.id}`}
                              className="text-xs text-brand hover:underline"
                            >
                              Zone · {zone.tap_count} taps
                            </Link>
                          </div>
                          <div className="mt-1 flex flex-wrap gap-1.5">
                            {zone.taps.map((tap) => (
                              <Link
                                key={tap.id}
                                href={`/taps/${tap.id}`}
                                className="inline-flex items-center gap-1 rounded-md border border-line px-2 py-1 text-xs text-muted hover:border-brand/40"
                              >
                                {tap.name}
                                {tap.is_control ? (
                                  <Badge kind="control">control</Badge>
                                ) : null}
                                <span className="mono">{tap.architecture}</span>
                              </Link>
                            ))}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      ))}

      <p className="text-xs text-muted">
        Physical pilot = Hostel Block · 3 taps. Professor demo scale lives in{" "}
        <strong>Showcase Wing</strong> (hidden until Organization →{" "}
        <code className="mono">showcase_scale</code>). Seed with{" "}
        <code className="mono">python -m scripts.seed_wave2</code>.
      </p>
    </div>
  );
}
