"use client";

import Link from "next/link";
import { Eye } from "lucide-react";
import { useApiData } from "@/lib/useApiData";
import { ColorBand, formatLiters, formatRelative, VisibilityLive } from "@/lib/types";

function bandClasses(band: ColorBand | undefined, open: boolean): string {
  if (!open) return "border-white/10 bg-white/5";
  if (band === "red") return "border-red-400/60 bg-red-500/15";
  if (band === "amber") return "border-amber-400/60 bg-amber-500/15";
  if (band === "green") return "border-emerald-400/60 bg-emerald-500/15";
  return "border-cyan-400/50 bg-cyan-500/10";
}

function bandDot(band: ColorBand | undefined): string {
  if (band === "red") return "bg-red-400";
  if (band === "amber") return "bg-amber-400";
  if (band === "green") return "bg-emerald-400";
  return "bg-white/30";
}

/**
 * Phase 1+ wall/phone display — intervention taps B & C only.
 * Phase 2 adds wordless color bands. Control (tap_a) is never shown.
 */
export default function VisibilityPage() {
  const live = useApiData<VisibilityLive>("/api/v1/visibility/live", {
    refreshMs: 1000,
    auth: false,
  });

  if (live.loading && !live.data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-ink text-white">
        <p className="text-lg text-white/70">Connecting…</p>
      </main>
    );
  }

  if (live.error && !live.data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-ink px-6 text-center text-white">
        <div>
          <p className="text-xl font-semibold">Visibility offline</p>
          <p className="mt-2 text-white/60">{live.error}</p>
          <p className="mt-4 text-sm text-white/40">Check that the API is running on port 8000.</p>
        </div>
      </main>
    );
  }

  const data = live.data!;
  if (!data.visibility_enabled) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-6 text-center text-white">
        <Eye className="mb-4 h-10 w-10 text-white/40" />
        <p className="text-2xl font-semibold">Phase 0 — Silent</p>
        <p className="mt-2 max-w-md text-white/60">
          User-facing liters are off. Enable <strong>Phase 1 — Visibility</strong> (or Phase 2) in
          Settings to show Tap B &amp; C only (never control).
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-8">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-cyan-300/80">TapSense</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
            {data.label}
          </h1>
          <p className="mt-2 text-sm text-white/50">
            {data.color_enabled
              ? "Numbers + wordless color · Tap A (control) hidden"
              : "Numbers only · Tap A (control) hidden"}
          </p>
        </div>
        <Link href="/" className="text-xs text-cyan-300/80 hover:text-cyan-200">
          ← Admin overview
        </Link>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {data.channels.map((ch) => (
          <section
            key={ch.tap_id}
            className={`rounded-3xl border px-6 py-8 sm:px-8 ${bandClasses(ch.band, ch.session_open)}`}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-lg font-medium text-white/80">{ch.name}</p>
              {data.color_enabled ? (
                <span className="inline-flex items-center gap-2 text-xs uppercase tracking-wide text-white/60">
                  <span className={`h-2.5 w-2.5 rounded-full ${bandDot(ch.band)}`} />
                  {ch.session_open ? ch.band ?? "—" : "idle"}
                </span>
              ) : null}
            </div>
            <p className="mono text-xs text-white/40">{ch.tap_id}</p>
            <p
              className="mt-6 font-semibold tracking-tight text-white"
              style={{ fontSize: "clamp(3rem, 12vw, 6rem)" }}
            >
              {formatLiters(ch.session_liters).replace(" L", "")}
              <span className="ml-2 text-3xl font-medium text-white/50">L</span>
            </p>
            <p className="mt-4 text-sm text-white/50">
              {ch.session_open
                ? `Flowing · last pulse ${formatRelative(ch.last_flow_at)}`
                : "Idle — open this tap to see liters"}
              {data.color_enabled && ch.threshold_liters
                ? ` · cue at ${ch.threshold_liters.toFixed(2)} L`
                : ""}
            </p>
          </section>
        ))}
      </div>
    </main>
  );
}
