"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Bell, CheckCircle2, Radio } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorRetry, LoadingBlock } from "@/components/ui/QueryState";
import { useAuth } from "@/components/providers/AppProviders";
import { ApiError, apiFetch } from "@/lib/api";
import { hasCap } from "@/lib/roles";
import { cn } from "@/lib/cn";
import { Device, Tap, deviceLabel, formatRelative, formatWhen, tapLabel } from "@/lib/types";
import { useApiData } from "@/lib/useApiData";

type Alert = {
  id: string;
  type: string;
  device_id?: string;
  tap_id?: string;
  status?: string;
  message?: string;
  open?: boolean;
  acked?: boolean;
  acked_by?: string;
  severity?: string;
  liters?: number;
  age_seconds?: number | null;
  last_seen_at?: string | null;
  updated_at?: string;
};

type AlertsRes = { count: number; alerts: Alert[] };
type Tab = "open" | "resolved" | "all";

function alertIcon(type: string) {
  if (type === "leak_suspect") return <AlertTriangle className="h-5 w-5 text-warn" />;
  if (type === "device_offline" || type === "device_stale") {
    return <Radio className="h-5 w-5 text-danger" />;
  }
  return <Bell className="h-5 w-5 text-info" />;
}

function alertSeverityKind(type: string): "warn" | "danger" | "info" {
  if (type === "leak_suspect") return "warn";
  if (type === "device_offline" || type === "device_stale") return "danger";
  return "info";
}

function alertTypeLabel(type: string) {
  if (type === "leak_suspect") return "Leak Suspect";
  if (type === "device_offline") return "Device Offline";
  if (type === "device_stale") return "Device Stale";
  return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function isOpen(a: Alert) {
  if (typeof a.open === "boolean") return a.open;
  return a.status !== "resolved" && a.status !== "closed";
}

export default function AlertsPage() {
  const { user } = useAuth();
  const canManage = hasCap(user, "alerts_manage");
  const [tab, setTab] = useState<Tab>("open");
  const path =
    tab === "open"
      ? "/api/v1/alerts?refresh=true&open_only=true"
      : "/api/v1/alerts?refresh=true&open_only=false";
  const q = useApiData<AlertsRes>(path, { refreshMs: 10000 });
  const devices = useApiData<Device[]>("/api/v1/devices");
  const taps = useApiData<Tap[]>("/api/v1/taps");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const act = async (id: string, action: "ack" | "resolve") => {
    setBusyId(id);
    setMsg(null);
    try {
      await apiFetch(`/api/v1/alerts/${encodeURIComponent(id)}/${action}`, {
        method: "POST",
        body: action === "resolve" ? JSON.stringify({ note: "Resolved from UI" }) : undefined,
      });
      setMsg(action === "ack" ? "Alert acknowledged" : "Alert resolved");
      void q.reload();
    } catch (err) {
      setMsg(err instanceof ApiError ? err.message : "Action failed");
    } finally {
      setBusyId(null);
    }
  };

  const alerts = useMemo(() => {
    const list = q.data?.alerts ?? [];
    if (tab === "open") return list.filter(isOpen);
    if (tab === "resolved") return list.filter((a) => !isOpen(a));
    return list;
  }, [q.data, tab]);

  if (q.loading && !q.data) return <LoadingBlock />;
  if (q.error && !q.data) {
    return <ErrorRetry message={q.error} onRetry={() => void q.reload()} />;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight text-ink">Alerts</h1>
          <p className="mt-1 text-sm text-ink-secondary">
            Offline devices and leak-like open sessions.
          </p>
        </div>
        <Button variant="ghost" onClick={() => void q.reload()}>
          Refresh
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {([
          ["open", "Open"],
          ["resolved", "Resolved"],
          ["all", "All"],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              "rounded-full px-4 py-2 text-xs font-semibold transition-all duration-150",
              tab === key
                ? "bg-brand text-white shadow-sm"
                : "border border-line bg-surface text-ink-secondary hover:bg-bg-subtle",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {msg ? (
        <div className="callout flex items-center gap-2 text-sm text-ink-secondary">
          <CheckCircle2 className="h-4 w-4 text-ok" />
          {msg}
        </div>
      ) : null}

      {alerts.length === 0 ? (
        <EmptyState
          title={tab === "open" ? "All systems healthy" : "No alerts in this view"}
          description={
            tab === "open"
              ? "No active alerts — all devices are reporting normally."
              : "Resolved and historical alerts will appear here when available."
          }
          icon={tab === "open" ? "success" : "water"}
        />
      ) : (
        <div className="space-y-3">
          {alerts.map((a) => {
            const subject = a.tap_id
              ? tapLabel(taps.data ?? [], a.tap_id)
              : deviceLabel(devices.data ?? [], a.device_id);
            return (
              <div
                key={a.id}
                className="card flex flex-wrap items-start justify-between gap-4 p-5"
              >
                <div className="flex items-start gap-4">
                  <div className="mt-0.5 shrink-0">{alertIcon(a.type)}</div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-ink">
                        {alertTypeLabel(a.type)} — {subject}
                      </span>
                      <Badge kind={alertSeverityKind(a.type)}>
                        {a.severity === "critical" || a.severity === "high"
                          ? a.severity
                          : isOpen(a)
                            ? "Open"
                            : "Resolved"}
                      </Badge>
                      {a.acked ? <Badge kind="neutral">Acknowledged</Badge> : null}
                    </div>
                    <p className="mt-1.5 text-sm text-ink-secondary">
                      {a.message ??
                        (a.type === "device_offline"
                          ? "No data received recently from this device."
                          : a.type === "leak_suspect"
                            ? "Session looks unusually long — check for a running tap."
                            : "Alert triggered")}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      Triggered {formatWhen(a.updated_at ?? a.last_seen_at)}
                      {" · "}
                      {formatRelative(a.updated_at ?? a.last_seen_at ?? null)}
                      {a.liters != null ? ` · ${a.liters.toFixed(2)} L` : null}
                    </p>
                  </div>
                </div>
                {canManage && isOpen(a) ? (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="ghost"
                      className="min-h-9 px-3 text-xs"
                      disabled={busyId === a.id || Boolean(a.acked)}
                      onClick={() => void act(a.id, "ack")}
                    >
                      Acknowledge
                    </Button>
                    <Button
                      variant="primary"
                      className="min-h-9 px-3 text-xs"
                      disabled={busyId === a.id}
                      onClick={() => void act(a.id, "resolve")}
                    >
                      Resolve
                    </Button>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
