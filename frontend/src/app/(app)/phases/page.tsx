"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Circle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { ErrorRetry, LoadingBlock } from "@/components/ui/QueryState";
import { ApiError, apiFetch } from "@/lib/api";
import { useApiData } from "@/lib/useApiData";
import { PHASE_OPTIONS } from "@/lib/science";
import { PhaseWindows, ProductPhase } from "@/lib/types";

const PHASE_BLURBS: Record<number, string> = {
  0: "Silent baseline — measure only, no user-facing liters.",
  1: "Visibility — numbers on Tap B & C; Tap A stays control.",
  2: "Loss-aversion color — green → amber → red cues on intervention taps.",
  3: "Social comparison — public board + quiet recognition.",
};

export default function PhasesPage() {
  const windows = useApiData<PhaseWindows>("/api/v1/phase-windows");
  const product = useApiData<ProductPhase>("/api/v1/product-phase", { refreshMs: 8000 });

  const [editPhase, setEditPhase] = useState(0);
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const seeded = useRef(false);

  const list = useMemo(() => {
    const w = windows.data?.windows ?? {};
    return PHASE_OPTIONS.map((p) => w[String(p)]).filter(Boolean);
  }, [windows.data]);

  const loadEditor = (phase: number) => {
    const w = windows.data?.windows?.[String(phase)];
    setEditPhase(phase);
    setEditStart(w?.start ?? "");
    setEditEnd(w?.end ?? "");
    setEditNotes(w?.notes ?? "");
  };

  useEffect(() => {
    if (!windows.data || seeded.current) return;
    seeded.current = true;
    const phase = product.data?.product_phase ?? 0;
    const w = windows.data.windows?.[String(phase)];
    setEditPhase(phase);
    setEditStart(w?.start ?? "");
    setEditEnd(w?.end ?? "");
    setEditNotes(w?.notes ?? "");
  }, [windows.data, product.data?.product_phase]);

  const save = async () => {
    setBusy(true);
    setMsg(null);
    try {
      await apiFetch("/api/v1/phase-windows", {
        method: "PATCH",
        body: JSON.stringify({
          phase: editPhase,
          start: editStart || null,
          end: editEnd || null,
          notes: editNotes || null,
        }),
      });
      setMsg(`Saved Phase ${editPhase} date window.`);
      void windows.reload();
    } catch (err) {
      setMsg(err instanceof ApiError ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  if (windows.loading && !windows.data) return <LoadingBlock />;
  if (windows.error && !windows.data) {
    return <ErrorRetry message={windows.error} onRetry={() => void windows.reload()} />;
  }

  const active = product.data?.product_phase ?? 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight text-ink">Phases</h1>
          <p className="mt-1 text-sm text-ink-secondary">
            Timeline with campus date ranges. Tag windows here, then{" "}
            <Link href="/compare" className="font-medium text-brand hover:text-brand-strong">
              Compare →
            </Link>
          </p>
        </div>
        <Badge kind="phase">{product.data?.label ?? "…"}</Badge>
      </div>

      {msg ? (
        <div className="callout text-sm text-ink-secondary">{msg}</div>
      ) : null}

      {/* ── Timeline ── */}
      <section className="space-y-0">
        <h2 className="mb-4 text-base font-semibold text-ink">Timeline</h2>
        <div className="relative ml-4 border-l-2 border-line pl-6 space-y-4">
          {list.map((w) => {
            const isLive = w.phase === active;
            const tagged = Boolean(w.start && w.end);
            const isPast = w.phase < active;
            return (
              <div key={w.phase} className="relative">
                {/* Timeline dot */}
                <div className="absolute -left-[calc(1.5rem+5px)] top-5">
                  {isLive ? (
                    <div className="flex h-4 w-4 items-center justify-center rounded-full bg-brand">
                      <div className="h-1.5 w-1.5 rounded-full bg-white" />
                    </div>
                  ) : isPast && tagged ? (
                    <CheckCircle2 className="h-4 w-4 text-ok" />
                  ) : (
                    <Circle className="h-4 w-4 text-line" />
                  )}
                </div>
                {/* Phase card */}
                <button
                  type="button"
                  onClick={() => loadEditor(w.phase)}
                  className={`card card-interactive w-full p-5 text-left transition-all duration-150 ${
                    editPhase === w.phase ? "border-brand shadow-card-hover" : ""
                  } ${isLive ? "bg-brand-wash/30" : ""}`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-ink">{w.label}</span>
                    {isLive && <Badge kind="status">Active</Badge>}
                    {!tagged && !isLive && (
                      <span className="inline-flex items-center gap-1 text-xs text-muted">
                        <Clock className="h-3 w-3" />
                        Dates not set
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-sm text-ink-secondary">{PHASE_BLURBS[w.phase]}</p>
                  {tagged && (
                    <p className="mt-2 text-sm font-medium text-ink">
                      {w.start} → {w.end}
                    </p>
                  )}
                  {w.notes ? <p className="mt-1 text-xs text-muted">{w.notes}</p> : null}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Edit Panel ── */}
      <section className="card p-6 space-y-4">
        <h2 className="text-base font-semibold text-ink">Edit Date Range</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="phase">Phase</Label>
            <select
              id="phase"
              className="min-h-12 w-full rounded-xl border border-line bg-surface px-4 text-sm text-ink outline-none transition-all duration-150 focus:border-brand focus:ring-2 focus:ring-brand/20"
              value={editPhase}
              onChange={(e) => loadEditor(Number(e.target.value))}
            >
              {PHASE_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  Phase {p}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="p-start">Start</Label>
            <Input
              id="p-start"
              type="date"
              value={editStart}
              onChange={(e) => setEditStart(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="p-end">End</Label>
            <Input
              id="p-end"
              type="date"
              value={editEnd}
              onChange={(e) => setEditEnd(e.target.value)}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="p-notes">Notes</Label>
          <Input
            id="p-notes"
            value={editNotes}
            onChange={(e) => setEditNotes(e.target.value)}
            placeholder="e.g. silent baseline week 1"
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <Button disabled={busy} onClick={() => void save()}>
            Save Window
          </Button>
          <Link href="/compare">
            <Button variant="secondary">Go to Compare</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
