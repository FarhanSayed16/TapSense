"use client";

import Link from "next/link";
import { useState } from "react";
import { Download, FileSpreadsheet } from "lucide-react";
import { DateWindowFields } from "@/components/science/DateWindowFields";
import { HonestyBanner } from "@/components/science/HonestyBanner";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataRow, DataTable, Td } from "@/components/ui/DataTable";
import { ApiError, apiDownload, apiFetch } from "@/lib/api";
import { campusToday, daysAgo } from "@/lib/science";
import { useApiData } from "@/lib/useApiData";
import { AlertRow, PhaseWindows } from "@/lib/types";

export default function ReportsPage() {
  const windows = useApiData<PhaseWindows>("/api/v1/phase-windows");
  const alerts = useApiData<{ count: number; alerts: AlertRow[] }>("/api/v1/alerts?refresh=true", {
    refreshMs: 30000,
  });

  const [start, setStart] = useState(daysAgo(7));
  const [end, setEnd] = useState(campusToday());
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const applyPhase = (phase: number) => {
    const w = windows.data?.windows?.[String(phase)];
    if (w?.start && w?.end) {
      setStart(w.start);
      setEnd(w.end);
      setMsg(`Using Phase ${phase} window: ${w.start} → ${w.end}`);
    } else {
      setMsg(`Phase ${phase} has no dates — set them on Phases first.`);
    }
  };

  const download = async (kind: "sessions" | "daily", format: "csv" | "json") => {
    setBusy(`export-${kind}-${format}`);
    setMsg(null);
    try {
      const path = `/api/v1/exports/${kind}?start=${start}&end=${end}&format=${format}`;
      if (format === "csv") {
        await apiDownload(path, `${kind}_${start}_${end}.csv`);
      } else {
        const data = await apiFetch<unknown>(path);
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${kind}_${start}_${end}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      }
      setMsg(`Downloaded ${kind}.${format}`);
    } catch (err) {
      setMsg(err instanceof ApiError ? err.message : "Export failed");
    } finally {
      setBusy(null);
    }
  };

  const reconcile = async () => {
    setBusy("reconcile");
    setMsg(null);
    try {
      const result = await apiFetch<{ date: string; taps: number }>(
        "/api/v1/admin/reconcile-daily",
        { method: "POST" },
      );
      setMsg(`Reconciled ${result.date}: ${result.taps} taps.`);
    } catch (err) {
      setMsg(err instanceof ApiError ? err.message : "Reconcile failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[28px] font-bold tracking-tight text-ink">Reports</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Download data packs for a campus date window.{" "}
          <Link href="/compare" className="font-medium text-brand hover:text-brand-strong">
            Compare →
          </Link>
        </p>
      </div>

      <HonestyBanner text="Exports include control Tap A for science — never show those liters on user displays." />

      {msg ? (
        <div className="callout text-sm text-ink-secondary">{msg}</div>
      ) : null}

      {/* ── Date Window ── */}
      <section className="card p-6 space-y-5">
        <div className="flex items-center gap-2.5">
          <FileSpreadsheet className="h-5 w-5 text-brand" />
          <h2 className="text-base font-semibold text-ink">Export Window</h2>
        </div>
        <DateWindowFields start={start} end={end} onStart={setStart} onEnd={setEnd} />
        <div className="flex flex-wrap gap-2">
          {[0, 1, 2, 3].map((p) => (
            <Button key={p} variant="ghost" className="min-h-9 px-3 text-xs" onClick={() => applyPhase(p)}>
              Phase {p}
            </Button>
          ))}
          <Link href="/phases">
            <Button variant="ghost" className="min-h-9 px-3 text-xs">Edit phase dates</Button>
          </Link>
        </div>
      </section>

      {/* ── Download Section ── */}
      <section className="card p-6 space-y-4">
        <h2 className="text-base font-semibold text-ink">Download</h2>
        <div className="divide-y divide-line">
          {[
            { kind: "sessions" as const, format: "csv" as const, label: "Sessions CSV" },
            { kind: "sessions" as const, format: "json" as const, label: "Sessions JSON" },
            { kind: "daily" as const, format: "csv" as const, label: "Daily Aggregates CSV" },
            { kind: "daily" as const, format: "json" as const, label: "Daily Aggregates JSON" },
          ].map((item) => (
            <div
              key={`${item.kind}-${item.format}`}
              className="flex items-center justify-between py-3"
            >
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="h-4 w-4 text-muted" />
                <span className="text-sm font-medium text-ink">{item.label}</span>
              </div>
              <Button
                variant="secondary"
                className="min-h-9 px-3 text-xs"
                disabled={!!busy}
                onClick={() => void download(item.kind, item.format)}
              >
                <Download className="h-3.5 w-3.5" />
                Download
              </Button>
            </div>
          ))}
        </div>
        <div className="border-t border-line pt-3">
          <Button
            variant="ghost"
            className="min-h-9 px-3 text-xs"
            disabled={busy === "reconcile"}
            onClick={() => void reconcile()}
          >
            Reconcile yesterday
          </Button>
        </div>
      </section>

      {/* ── Alert Summary ── */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-ink">Device Alerts</h2>
          <Badge kind="neutral">{alerts.data?.count ?? 0} open</Badge>
        </div>
        {(alerts.data?.alerts?.length ?? 0) === 0 ? (
          <p className="text-sm text-ink-secondary">No open alerts — all devices reporting.</p>
        ) : (
          <DataTable headers={["Device", "Age"]}>
            {alerts.data!.alerts.map((a) => (
              <DataRow key={a.id}>
                <Td>
                  <span className="font-semibold text-ink">{a.device_id}</span>
                  <Badge kind="neutral" className="ml-2">
                    {a.status}
                  </Badge>
                </Td>
                <Td>
                  {a.age_seconds != null
                    ? `${Math.round(a.age_seconds / 60)} min since last seen`
                    : "never seen"}
                </Td>
              </DataRow>
            ))}
          </DataTable>
        )}
      </section>
    </div>
  );
}
