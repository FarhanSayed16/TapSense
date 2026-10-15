"use client";

import { useState } from "react";
import { RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/components/providers/AppProviders";
import { useToast } from "@/components/ui/Toast";
import { ApiError, apiFetch } from "@/lib/api";
import { hasCap } from "@/lib/roles";
import { cn } from "@/lib/cn";

type ResetResult = {
  date: string;
  deleted: { sessions: number; readings: number; daily_aggregates: number };
};

/**
 * Clears today's sessions / readings / daily totals.
 * Meant for bucket calibration loops — confirm once, no typing.
 */
export function ResetTodayControl({
  onDone,
  className,
  variant = "outline",
  label = "Reset today's readings",
}: {
  onDone?: () => void;
  className?: string;
  variant?: "outline" | "danger";
  label?: string;
}) {
  const { user } = useAuth();
  const { push } = useToast();
  const canReset = hasCap(user, "reset");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!canReset) return null;

  const runReset = async () => {
    setBusy(true);
    try {
      const result = await apiFetch<ResetResult>("/api/v1/admin/reset-today", {
        method: "POST",
      });
      push(
        `Cleared ${result.date}: ${result.deleted.sessions} sessions, ${result.deleted.readings} readings`,
        "ok",
      );
      setOpen(false);
      onDone?.();
    } catch (err) {
      push(err instanceof ApiError ? err.message : "Reset failed", "danger");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={busy}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold shadow-soft transition-colors",
          variant === "danger"
            ? "border border-danger/30 bg-danger-bg text-danger hover:bg-danger/10"
            : "border border-line bg-surface text-ink-secondary hover:border-danger/40 hover:bg-danger-bg hover:text-danger",
          className,
        )}
      >
        <RotateCcw className="h-3.5 w-3.5" />
        {label}
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm">
          <div className="card w-full max-w-md p-6 shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-ink">Reset for calibration?</h3>
                <p className="mt-1.5 text-sm text-ink-secondary">
                  Clears <span className="font-semibold text-ink">today&apos;s</span> sessions,
                  readings, and liter totals so your next bucket test starts from zero.
                  Does not change pulses/L or firmware.
                </p>
              </div>
              <button
                type="button"
                className="rounded-lg p-1.5 text-muted hover:bg-bg-subtle hover:text-ink"
                onClick={() => setOpen(false)}
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>
                Cancel
              </Button>
              <Button variant="danger" onClick={() => void runReset()} disabled={busy}>
                {busy ? "Resetting…" : "Yes, reset today"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
