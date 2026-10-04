"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Palette, Sparkles } from "lucide-react";
import { DateWindowFields } from "@/components/science/DateWindowFields";
import { HonestyBanner } from "@/components/science/HonestyBanner";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { ErrorRetry, LoadingBlock } from "@/components/ui/QueryState";
import { ApiError, apiFetch } from "@/lib/api";
import { campusToday, daysAgo } from "@/lib/science";
import { useApiData } from "@/lib/useApiData";
import { formatLiters, ProductPhase, ThresholdsConfig } from "@/lib/types";

function BandPreview({
  greenMax,
  amberMax,
}: {
  greenMax: number;
  amberMax: number;
}) {
  const total = Math.max(amberMax * 1.3, 0.01);
  const greenPct = Math.min(100, (greenMax / total) * 100);
  const amberPct = Math.min(100, (amberMax / total) * 100);
  return (
    <div className="space-y-3">
      <div className="relative h-5 overflow-hidden rounded-full bg-bg-subtle">
        <div
          className="absolute inset-y-0 left-0 rounded-l-full"
          style={{ width: `${greenPct}%`, background: "var(--threshold-green)" }}
        />
        <div
          className="absolute inset-y-0"
          style={{
            left: `${greenPct}%`,
            width: `${Math.max(0, amberPct - greenPct)}%`,
            background: "var(--threshold-amber)",
          }}
        />
        <div
          className="absolute inset-y-0 right-0 rounded-r-full"
          style={{ left: `${amberPct}%`, background: "var(--threshold-red)" }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted">
        <span>
          <span className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full bg-ok" />
          Green &lt; {greenMax.toFixed(2)}×
        </span>
        <span>
          <span className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full bg-warn" />
          Amber &lt; {amberMax.toFixed(2)}×
        </span>
        <span>
          <span className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full bg-danger" />
          Red ≥ {amberMax.toFixed(2)}×
        </span>
      </div>
    </div>
  );
}

export default function ThresholdsPage() {
  const config = useApiData<ThresholdsConfig>("/api/v1/thresholds");
  const phase = useApiData<ProductPhase>("/api/v1/product-phase", { refreshMs: 8000 });

  const [greenMax, setGreenMax] = useState("1");
  const [amberMax, setAmberMax] = useState("1.5");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [start, setStart] = useState(daysAgo(14));
  const [end, setEnd] = useState(campusToday());
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!config.data) return;
    setGreenMax(String(config.data.bands.green_max_ratio));
    setAmberMax(String(config.data.bands.amber_max_ratio));
    const next: Record<string, string> = {};
    for (const [tid, row] of Object.entries(config.data.taps)) {
      next[tid] = String(row.session_liters_threshold);
    }
    setDrafts(next);
  }, [config.data]);

  const intervention = useMemo(() => {
    return Object.values(config.data?.taps ?? {}).filter((t) => !t.is_control);
  }, [config.data]);

  const saveBands = async () => {
    setBusy("bands");
    setMsg(null);
    try {
      await apiFetch("/api/v1/thresholds", {
        method: "PATCH",
        body: JSON.stringify({
          bands: {
            green_max_ratio: Number(greenMax),
            amber_max_ratio: Number(amberMax),
          },
        }),
      });
      setMsg("Band ratios saved.");
      void config.reload();
    } catch (err) {
      setMsg(err instanceof ApiError ? err.message : "Save failed");
    } finally {
      setBusy(null);
    }
  };

  const saveTap = async (tapId: string) => {
    setBusy(`tap-${tapId}`);
    setMsg(null);
    try {
      await apiFetch("/api/v1/thresholds", {
        method: "PATCH",
        body: JSON.stringify({
          taps: {
            [tapId]: {
              session_liters_threshold: Number(drafts[tapId]),
              enabled: true,
              source: "manual",
            },
          },
        }),
      });
      setMsg(`Saved threshold for ${config.data?.taps[tapId]?.name ?? tapId}.`);
      void config.reload();
    } catch (err) {
      setMsg(err instanceof ApiError ? err.message : "Save failed");
    } finally {
      setBusy(null);
    }
  };

  const suggest = async (apply: boolean) => {
    setBusy(apply ? "apply" : "suggest");
    setMsg(null);
    try {
      const result = await apiFetch<{
        suggestions?: Record<
          string,
          { suggested_threshold: number | null; session_count: number; note: string }
        >;
        taps?: ThresholdsConfig["taps"];
        honesty?: string;
      }>("/api/v1/thresholds/suggest", {
        method: "POST",
        body: JSON.stringify({ start, end, apply }),
      });
      if (apply) {
        setMsg("Applied median suggestions to intervention taps.");
        void config.reload();
      } else {
        const lines = Object.entries(result.suggestions ?? {})
          .filter(([, r]) => r.suggested_threshold != null)
          .map(
            ([, r]) =>
              `${r.suggested_threshold} L (${r.session_count} sessions) — ${r.note}`,
          );
        setMsg(lines.length ? lines.join(" · ") : "No suggestions (empty window).");
      }
    } catch (err) {
      setMsg(err instanceof ApiError ? err.message : "Suggest failed");
    } finally {
      setBusy(null);
    }
  };

  if (config.loading && !config.data) return <LoadingBlock />;
  if (config.error && !config.data) {
    return <ErrorRetry message={config.error} onRetry={() => void config.reload()} />;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight text-ink">Thresholds</h1>
          <p className="mt-1 text-sm text-ink-secondary">
            Phase 2 loss-aversion color bands — wordless green → amber → red cues.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge kind="phase">{phase.data?.label ?? "…"}</Badge>
          {phase.data?.color_enabled ? (
            <Badge kind="status">Color Active</Badge>
          ) : (
            <Badge kind="neutral">Color Off</Badge>
          )}
        </div>
      </div>

      <HonestyBanner text="No guilt strings in config or device — color + brief pulse only. Thresholds are descriptive." />

      {msg ? (
        <div className="callout text-sm text-ink-secondary">{msg}</div>
      ) : null}

      {/* ── Band Ratios ── */}
      <section className="card p-6 space-y-5">
        <div className="flex items-center gap-2.5">
          <Palette className="h-5 w-5 text-brand" />
          <h2 className="text-base font-semibold text-ink">Band Ratios</h2>
        </div>
        <BandPreview greenMax={Number(greenMax) || 1} amberMax={Number(amberMax) || 1.5} />
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="gmax">Green max ratio</Label>
            <Input id="gmax" value={greenMax} onChange={(e) => setGreenMax(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="amax">Amber max ratio</Label>
            <Input id="amax" value={amberMax} onChange={(e) => setAmberMax(e.target.value)} />
          </div>
        </div>
        <Button disabled={busy === "bands"} onClick={() => void saveBands()}>
          Save Bands
        </Button>
      </section>

      {/* ── Per-tap Thresholds ── */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-ink">Per-Tap Session Thresholds</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {intervention.map((t) => (
            <div key={t.tap_id} className="card p-5 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-ink">{t.name}</p>
                <Badge kind="neutral" className="capitalize">{t.source}</Badge>
              </div>
              <div>
                <Label htmlFor={`th-${t.tap_id}`}>Session liters threshold</Label>
                <Input
                  id={`th-${t.tap_id}`}
                  value={drafts[t.tap_id] ?? ""}
                  onChange={(e) => setDrafts((d) => ({ ...d, [t.tap_id]: e.target.value }))}
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-muted">
                  Green &lt; {formatLiters(Number(drafts[t.tap_id]) || 0)} · Red ≥{" "}
                  {formatLiters((Number(drafts[t.tap_id]) || 0) * (Number(amberMax) || 1.5))}
                </p>
                <Button
                  variant="secondary"
                  className="min-h-9 px-3 text-xs"
                  disabled={busy === `tap-${t.tap_id}`}
                  onClick={() => void saveTap(t.tap_id)}
                >
                  Save
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Auto-suggest ── */}
      <section className="card p-6 space-y-5">
        <div className="flex items-center gap-2.5">
          <Sparkles className="h-5 w-5 text-brand" />
          <h2 className="text-base font-semibold text-ink">Auto-suggest from Baseline</h2>
        </div>
        <p className="text-sm text-ink-secondary">
          Uses median closed-session liters per intervention tap.{" "}
          <Link href="/phases" className="font-medium text-brand hover:text-brand-strong">
            Set dates on Phases
          </Link>{" "}
          for a named window.
        </p>
        <DateWindowFields start={start} end={end} onStart={setStart} onEnd={setEnd} />
        <div className="flex flex-wrap gap-3">
          <Button variant="ghost" disabled={!!busy} onClick={() => void suggest(false)}>
            Preview Medians
          </Button>
          <Button disabled={!!busy} onClick={() => void suggest(true)}>
            Apply Suggestions
          </Button>
        </div>
      </section>
    </div>
  );
}
