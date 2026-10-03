"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/components/providers/AppProviders";
import { ApiError, apiFetch } from "@/lib/api";

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [resetting, setResetting] = useState(false);
  const [resetMsg, setResetMsg] = useState<string | null>(null);

  const resetToday = async () => {
    const ok = window.confirm(
      "Reset all of today's water data?\n\nClears today's sessions, readings, and liter totals. Cannot be undone.",
    );
    if (!ok) return;
    setResetting(true);
    setResetMsg(null);
    try {
      const result = await apiFetch<{
        date: string;
        deleted: { sessions: number; readings: number; daily_aggregates: number };
      }>("/api/v1/admin/reset-today", { method: "POST" });
      setResetMsg(
        `Reset ${result.date}: ${result.deleted.sessions} sessions, ${result.deleted.readings} readings, ${result.deleted.daily_aggregates} daily rows removed.`,
      );
    } catch (err) {
      setResetMsg(err instanceof ApiError ? err.message : "Reset failed");
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Settings</h1>
        <p className="mt-1 text-sm text-muted">Profile, session, and day reset.</p>
      </div>
      <div className="rounded-xl border border-line bg-surface/90 p-5">
        <div className="mb-3 flex flex-wrap gap-2">
          <Badge kind="phase">MVP software complete</Badge>
          <Badge kind="neutral">Phase 0 silent until baseline GO</Badge>
        </div>
        <p className="text-sm text-muted">Signed in as</p>
        <p className="mt-1 font-medium text-ink">{user?.name}</p>
        <p className="mono text-sm text-muted">{user?.email}</p>
        <p className="mt-2 text-xs uppercase tracking-wide text-muted">{user?.role}</p>
        <Button
          variant="ghost"
          className="mt-6"
          onClick={async () => {
            await logout();
            router.replace("/login");
          }}
        >
          Log out
        </Button>
      </div>

      <div className="rounded-xl border border-line bg-surface/90 p-5">
        <h2 className="text-sm font-semibold text-ink">Reset today&apos;s data</h2>
        <p className="mt-1 text-sm text-muted">
          Clears liters, sessions, and readings for the current campus day (Asia/Kolkata) so you can
          start clean calculations. Does not delete taps, devices, or users.
        </p>
        <Button
          variant="danger"
          className="mt-4"
          disabled={resetting}
          onClick={() => void resetToday()}
        >
          {resetting ? "Resetting…" : "Reset today"}
        </Button>
        {resetMsg ? <p className="mt-3 text-sm text-muted">{resetMsg}</p> : null}
      </div>
    </div>
  );
}
