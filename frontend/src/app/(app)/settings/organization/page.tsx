"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ErrorRetry, LoadingBlock } from "@/components/ui/QueryState";
import { useAuth } from "@/components/providers/AppProviders";
import { ApiError, apiFetch } from "@/lib/api";
import { hasCap } from "@/lib/roles";
import { useApiData } from "@/lib/useApiData";

type Org = {
  id: string;
  name?: string;
  timezone?: string;
  feature_flags: Record<string, boolean>;
};

const FLAG_LABELS: Record<string, string> = {
  science_ui: "Science UI (phases / compare / reports)",
  leaderboard_public: "Public leaderboard",
  visibility_kiosk: "Visibility kiosk nav",
  valve_ui: "Valve UI (Phase 4 — keep off)",
  telegram_digest: "Telegram digest (Phase 21)",
  exports: "CSV / JSON exports",
  showcase_scale:
    "Showcase Wing (demo Floor 2 / tap D–E) — keep OFF for real pilot (3 pipes only)",
};

export default function OrganizationPage() {
  const { user } = useAuth();
  const allowed = hasCap(user, "flags");
  const q = useApiData<Org>(allowed ? "/api/v1/org" : null);
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (q.data?.feature_flags) setFlags(q.data.feature_flags);
  }, [q.data]);

  if (!allowed) {
    return (
      <div className="rounded-xl border border-line bg-surface/90 p-6 text-sm text-muted">
        Organization settings require org_admin.
      </div>
    );
  }

  if (q.loading && !q.data) return <LoadingBlock />;
  if (q.error && !q.data) {
    return <ErrorRetry message={q.error} onRetry={() => void q.reload()} />;
  }

  const save = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const next = await apiFetch<Org>("/api/v1/org/feature-flags", {
        method: "PATCH",
        body: JSON.stringify({ flags }),
      });
      setFlags(next.feature_flags);
      setMsg("Feature flags saved");
      void q.reload();
    } catch (err) {
      setMsg(err instanceof ApiError ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Organization</h1>
        <p className="mt-1 text-sm text-muted">
          {q.data?.name ?? "Org"} · {q.data?.timezone ?? "—"} ·{" "}
          <span className="mono text-xs">{q.data?.id}</span>
        </p>
      </div>

      <div className="rounded-xl border border-line bg-surface/90 p-5">
        <div className="mb-4 flex flex-wrap gap-2">
          <Badge kind="phase">feature flags</Badge>
          <Badge kind="neutral">per-org</Badge>
        </div>
        <div className="space-y-3">
          {Object.keys(FLAG_LABELS).map((key) => (
            <label
              key={key}
              className="flex cursor-pointer items-start gap-3 rounded-lg border border-line/80 px-3 py-2"
            >
              <input
                type="checkbox"
                className="mt-1"
                checked={Boolean(flags[key])}
                onChange={(e) => setFlags((prev) => ({ ...prev, [key]: e.target.checked }))}
              />
              <span>
                <span className="block text-sm font-medium text-ink">{FLAG_LABELS[key]}</span>
                <span className="mono text-xs text-muted">{key}</span>
              </span>
            </label>
          ))}
        </div>
        <Button className="mt-5" disabled={busy} onClick={() => void save()}>
          {busy ? "Saving…" : "Save flags"}
        </Button>
        {msg ? <p className="mt-3 text-sm text-muted">{msg}</p> : null}
      </div>
    </div>
  );
}
