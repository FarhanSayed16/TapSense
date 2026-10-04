"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Activity,
  Database,
  LogOut,
  Settings as SettingsIcon,
  Shield,
  User,
  Zap,
  Trash2,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/components/providers/AppProviders";
import { ApiError, apiFetch } from "@/lib/api";
import { hasCap } from "@/lib/roles";
import { useApiData } from "@/lib/useApiData";
import { useScale } from "@/lib/scale-context";
import { Overview, ProductPhase } from "@/lib/types";

type HealthRes = {
  status: string;
  mongo: boolean;
  redis: boolean | null;
  redis_configured?: boolean;
};

const PHASE_COPY: Record<
  0 | 1 | 2 | 3,
  { label: string; description: string; confirm: string; firmware: number }
> = {
  0: {
    label: "Phase 0 — Baseline",
    description: "Silent measurement — no user-facing liters or cues.",
    confirm:
      "Switch to Phase 0 — Baseline?\n\nHides user-facing liters/color/social. Set PRODUCT_PHASE_DISPLAY=0 in firmware.",
    firmware: 0,
  },
  1: {
    label: "Phase 1 — Visibility",
    description: "Live liters shown on Tap B & C. Tap A (control) stays hidden.",
    confirm:
      "Switch to Phase 1 — Visibility?\n\nTap B & C show live liters. Tap A stays hidden.\n\nSet PRODUCT_PHASE_DISPLAY=1 in firmware.",
    firmware: 1,
  },
  2: {
    label: "Phase 2 — Color",
    description: "Wordless green → amber → red threshold cues on B & C.",
    confirm:
      "Switch to Phase 2 — Color?\n\nWordless color cues on B/C. Tap A stays uncued.\n\nSet PRODUCT_PHASE_DISPLAY=2 in firmware.",
    firmware: 2,
  },
  3: {
    label: "Phase 3 — Social",
    description: "Public leaderboard with quiet recognition for lowest use.",
    confirm:
      "Switch to Phase 3 — Social?\n\nPublic leaderboard goes live.\n\nSet PRODUCT_PHASE_DISPLAY=3 in firmware.",
    firmware: 3,
  },
};

function HealthPill({ ok, label }: { ok: boolean | null; label: string }) {
  const kind = ok === true ? "status" : ok === false ? "danger" : "neutral";
  const text =
    ok === true ? `${label} OK` : ok === false ? `${label} issue` : `${label} n/a`;
  return <Badge kind={kind}>{text}</Badge>;
}

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { overviewPath } = useScale();
  const canAdmin = hasCap(user, "admin");
  const canReset = hasCap(user, "reset");
  const canMembers = hasCap(user, "members");
  const canFlags = hasCap(user, "flags");
  const phase = useApiData<ProductPhase>("/api/v1/product-phase", { refreshMs: 5000 });
  const health = useApiData<HealthRes>("/health", { refreshMs: 15000, auth: false });
  const overview = useApiData<Overview>(overviewPath, { refreshMs: 10000 });
  const [resetting, setResetting] = useState(false);
  const [resetMsg, setResetMsg] = useState<string | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetConfirm, setResetConfirm] = useState("");
  const [phaseBusy, setPhaseBusy] = useState(false);
  const [phaseMsg, setPhaseMsg] = useState<string | null>(null);

  const resetToday = async () => {
    if (resetConfirm.trim().toUpperCase() !== "RESET") return;
    setResetting(true);
    setResetMsg(null);
    try {
      const result = await apiFetch<{
        date: string;
        deleted: { sessions: number; readings: number; daily_aggregates: number };
      }>("/api/v1/admin/reset-today", { method: "POST" });
      setResetMsg(
        `Reset ${result.date}: ${result.deleted.sessions} sessions, ${result.deleted.readings} readings removed.`,
      );
      setResetOpen(false);
      setResetConfirm("");
    } catch (err) {
      setResetMsg(err instanceof ApiError ? err.message : "Reset failed");
    } finally {
      setResetting(false);
    }
  };

  const setPhase = async (next: 0 | 1 | 2 | 3) => {
    const meta = PHASE_COPY[next];
    if (!window.confirm(meta.confirm)) return;
    setPhaseBusy(true);
    setPhaseMsg(null);
    try {
      const result = await apiFetch<ProductPhase>("/api/v1/product-phase", {
        method: "PATCH",
        body: JSON.stringify({ product_phase: next }),
      });
      setPhaseMsg(`Switched to ${result.label}`);
      void phase.reload();
    } catch (err) {
      setPhaseMsg(err instanceof ApiError ? err.message : "Phase update failed");
    } finally {
      setPhaseBusy(false);
    }
  };

  const deviceOnline =
    overview.data?.health?.device_online ?? overview.data?.device_online ?? null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[28px] font-bold tracking-tight text-ink">Settings</h1>
        <p className="mt-1 text-sm text-ink-secondary">Profile and admin controls.</p>
      </div>

      {/* ── Profile Section ── */}
      <section className="card p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-wash text-brand-strong">
            <User className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <p className="text-lg font-semibold text-ink">{user?.name}</p>
            <p className="text-sm text-ink-secondary">{user?.email}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge kind="phase">{phase.data?.label ?? "…"}</Badge>
              <Badge kind="neutral" className="capitalize">{user?.role ?? "—"}</Badge>
            </div>
          </div>
          <Button
            variant="ghost"
            className="min-h-9 px-3 text-sm"
            onClick={async () => {
              await logout();
              router.replace("/login");
            }}
          >
            <LogOut className="h-4 w-4" />
            Log out
          </Button>
        </div>
        <div className="mt-5 flex flex-wrap gap-3 border-t border-line pt-4">
          {canMembers ? (
            <Link
              href="/settings/members"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:text-brand-strong"
            >
              <Shield className="h-3.5 w-3.5" />
              Members
            </Link>
          ) : null}
          {canFlags ? (
            <Link
              href="/settings/organization"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:text-brand-strong"
            >
              <SettingsIcon className="h-3.5 w-3.5" />
              Organization
            </Link>
          ) : null}
        </div>
      </section>

      {/* ── System Health (moved from Overview) ── */}
      <section className="card p-6">
        <div className="mb-4 flex items-center gap-2.5">
          <Activity className="h-5 w-5 text-brand" />
          <h2 className="text-base font-semibold text-ink">System Health</h2>
        </div>
        <p className="mb-4 text-sm text-ink-secondary">
          Quiet admin checks — kept off the Overview so professors see water data, not infrastructure.
        </p>
        <div className="flex flex-wrap gap-2">
          <HealthPill ok={health.data?.mongo ?? overview.data?.health?.mongo ?? null} label="Database" />
          <HealthPill
            ok={
              health.data?.redis_configured === false
                ? null
                : (health.data?.redis ?? overview.data?.health?.redis ?? null)
            }
            label="Cache"
          />
          <HealthPill ok={deviceOnline} label="Device" />
          <Badge kind={health.data?.status === "ok" ? "status" : health.data ? "warn" : "neutral"}>
            API {health.data?.status ?? "…"}
          </Badge>
        </div>
        <div className="mt-4 flex items-start gap-2 text-xs text-muted">
          <Database className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            These indicators are for operators only. Pilot monitoring stays focused on the three taps.
          </span>
        </div>
      </section>

      {/* ── Product Phase Section ── */}
      {canAdmin ? (
        <section className="card p-6">
          <div className="mb-4 flex items-center gap-2.5">
            <Zap className="h-5 w-5 text-brand" />
            <h2 className="text-base font-semibold text-ink">Product Phase</h2>
          </div>
          <p className="mb-5 text-sm text-ink-secondary">
            Controls which behavioral intervention layer is active. Each phase adds to the previous one.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {([0, 1, 2, 3] as const).map((p) => {
              const isActive = phase.data?.product_phase === p;
              return (
                <button
                  key={p}
                  type="button"
                  disabled={phaseBusy}
                  onClick={() => void setPhase(p)}
                  className={`rounded-xl border p-4 text-left transition-all duration-150 ${
                    isActive
                      ? "border-brand bg-brand-wash shadow-sm"
                      : "border-line bg-surface hover:border-brand/30 hover:bg-bg-subtle"
                  }`}
                >
                  <p className={`text-sm font-semibold ${isActive ? "text-brand-strong" : "text-ink"}`}>
                    {PHASE_COPY[p].label}
                  </p>
                  <p className="mt-1 text-xs text-ink-secondary">{PHASE_COPY[p].description}</p>
                  {isActive && (
                    <Badge kind="status" className="mt-2">Active</Badge>
                  )}
                </button>
              );
            })}
          </div>
          {phaseMsg ? (
            <div className="callout mt-4 text-sm text-ink-secondary">{phaseMsg}</div>
          ) : null}
        </section>
      ) : (
        <section className="card p-6">
          <p className="text-sm text-ink-secondary">
            Product phase controls are admin-only. Current: {phase.data?.label ?? "…"}.
          </p>
        </section>
      )}

      {/* ── Danger Zone ── */}
      {canReset ? (
        <section className="card border-danger/20 p-6">
          <div className="mb-3 flex items-center gap-2.5">
            <Trash2 className="h-5 w-5 text-danger" />
            <h2 className="text-base font-semibold text-danger">Danger Zone</h2>
          </div>
          <p className="text-sm text-ink-secondary">
            Clears all sessions, readings, and liter totals for today. Cannot be undone.
          </p>
          <Button
            variant="danger"
            className="mt-4"
            disabled={resetting}
            onClick={() => {
              setResetOpen(true);
              setResetConfirm("");
            }}
          >
            Reset today&apos;s data
          </Button>
          {resetMsg ? (
            <div className="callout callout-warn mt-4 text-sm text-ink-secondary">{resetMsg}</div>
          ) : null}
        </section>
      ) : null}

      {resetOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm">
          <div className="card w-full max-w-md p-6 shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-ink">Confirm reset</h3>
                <p className="mt-1 text-sm text-ink-secondary">
                  Type <span className="font-semibold text-danger">RESET</span> to clear today&apos;s
                  water data.
                </p>
              </div>
              <button
                type="button"
                className="rounded-lg p-1.5 text-muted hover:bg-bg-subtle hover:text-ink"
                onClick={() => setResetOpen(false)}
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <input
              value={resetConfirm}
              onChange={(e) => setResetConfirm(e.target.value)}
              placeholder="Type RESET"
              className="min-h-12 w-full rounded-xl border border-line bg-surface px-4 text-sm text-ink outline-none focus:border-danger focus:ring-2 focus:ring-danger/20"
              autoFocus
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setResetOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                disabled={resetting || resetConfirm.trim().toUpperCase() !== "RESET"}
                onClick={() => void resetToday()}
              >
                {resetting ? "Resetting…" : "Confirm reset"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
