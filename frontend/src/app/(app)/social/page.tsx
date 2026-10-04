"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { HonestyBanner } from "@/components/science/HonestyBanner";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { ErrorRetry, LoadingBlock } from "@/components/ui/QueryState";
import { ApiError, apiFetch } from "@/lib/api";
import { useApiData } from "@/lib/useApiData";
import { formatLiters, ProductPhase } from "@/lib/types";

type SocialField = {
  social_enabled: boolean;
  product_phase: number;
  label: string;
  placement_location: string;
  placement_notes: string;
  board_id: string;
  cadence_weekday: number;
  cadence_weekday_name: string;
  cadence_locked: boolean;
  locked_at: string | null;
  locked_by: string | null;
  recognition_label: string;
  checklist: Record<string, boolean>;
  current_week: {
    week_start: string;
    week_end: string;
    timezone: string;
    winner: { name: string; liters: number } | null;
    entry_count: number;
  };
  public_path: string;
  rule: string;
};

type Attribution = {
  title: string;
  layers: {
    layer: string;
    ready: boolean;
    detail?: string;
    intervention_mean_l_day_a?: number;
    intervention_mean_l_day_b?: number;
    control_mean_l_day_a?: number;
    control_mean_l_day_b?: number;
  }[];
  honesty: string;
  current_winner: { name: string; liters: number } | null;
};

const CHECK_LABELS: Record<string, string> = {
  board_placed: "Physical/screen board placed in common area",
  public_url_tested: "Public board URL tested on TV/kiosk",
  weekly_refresh_assigned: "Someone assigned to weekly refresh",
  control_still_uncued: "Control Tap A still uncued in field",
  no_shame_copy_verified: "No shame/guilt copy on board or posters",
};

export default function SocialFieldPage() {
  const social = useApiData<SocialField>("/api/v1/social-field", { refreshMs: 10000 });
  const phase = useApiData<ProductPhase>("/api/v1/product-phase", { refreshMs: 8000 });
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [recognition, setRecognition] = useState("");
  const [weekday, setWeekday] = useState(0);
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [attr, setAttr] = useState<Attribution | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!social.data) return;
    setLocation(social.data.placement_location);
    setNotes(social.data.placement_notes);
    setRecognition(social.data.recognition_label);
    setWeekday(social.data.cadence_weekday);
    setChecks(social.data.checklist);
  }, [social.data]);

  const save = async () => {
    setBusy("save");
    setMsg(null);
    try {
      await apiFetch("/api/v1/social-field", {
        method: "PATCH",
        body: JSON.stringify({
          placement_location: location,
          placement_notes: notes,
          recognition_label: recognition,
          cadence_weekday: weekday,
          checklist: checks,
        }),
      });
      setMsg("Field settings saved.");
      void social.reload();
    } catch (err) {
      setMsg(err instanceof ApiError ? err.message : "Save failed");
    } finally {
      setBusy(null);
    }
  };

  const lock = async () => {
    if (
      !window.confirm(
        "Lock weekly cadence?\n\nRefresh day and board id freeze. Checklist/placement notes can still update.",
      )
    ) {
      return;
    }
    setBusy("lock");
    setMsg(null);
    try {
      await apiFetch("/api/v1/social-field/lock-cadence", { method: "POST" });
      setMsg("Cadence locked. Snapshot refreshed for the current week.");
      void social.reload();
    } catch (err) {
      setMsg(err instanceof ApiError ? err.message : "Lock failed");
    } finally {
      setBusy(null);
    }
  };

  const unlock = async () => {
    setBusy("unlock");
    setMsg(null);
    try {
      await apiFetch("/api/v1/social-field/unlock-cadence", { method: "POST" });
      setMsg("Cadence unlocked.");
      void social.reload();
    } catch (err) {
      setMsg(err instanceof ApiError ? err.message : "Unlock failed");
    } finally {
      setBusy(null);
    }
  };

  const loadAttribution = async () => {
    setBusy("attr");
    setMsg(null);
    try {
      const data = await apiFetch<Attribution>("/api/v1/social-field/attribution");
      setAttr(data);
    } catch (err) {
      setMsg(err instanceof ApiError ? err.message : "Attribution failed");
    } finally {
      setBusy(null);
    }
  };

  if (social.loading && !social.data) return <LoadingBlock />;
  if (social.error && !social.data) {
    return <ErrorRetry message={social.error} onRetry={() => void social.reload()} />;
  }

  const s = social.data!;
  const winner = s.current_week.winner;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Social field</h1>
          <p className="mt-1 text-sm text-muted">
            Phase 3 placement, weekly cadence lock, and quiet recognition — before claiming science
            results.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge kind="phase">{phase.data?.label ?? s.label}</Badge>
          {s.social_enabled ? (
            <Badge kind="status">social on</Badge>
          ) : (
            <Badge kind="neutral">enable Phase 3 in Settings</Badge>
          )}
          {s.cadence_locked ? <Badge kind="status">cadence locked</Badge> : null}
        </div>
      </div>

      <HonestyBanner text={s.rule} />

      {msg ? (
        <p className="rounded-lg border border-line bg-surface/90 px-4 py-3 text-sm text-ink">{msg}</p>
      ) : null}

      <section className="rounded-xl border border-line bg-surface/90 p-5 space-y-3">
        <h2 className="text-sm font-semibold text-ink">This week&apos;s recognition</h2>
        {winner ? (
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">{s.recognition_label}</p>
            <p className="brand mt-1 text-3xl font-semibold text-ink">{winner.name}</p>
            <p className="mono mt-1 text-muted">{formatLiters(winner.liters)}</p>
          </div>
        ) : (
          <p className="text-sm text-muted">No winner yet — rebuild snapshot on Leaderboard.</p>
        )}
        <p className="mono text-xs text-muted">
          Week {s.current_week.week_start} → {s.current_week.week_end} · {s.current_week.timezone}
        </p>
        <div className="flex flex-wrap gap-2">
          <Link
            href={s.public_path}
            target="_blank"
            className="inline-flex min-h-11 items-center rounded-lg border border-line px-4 text-sm font-medium text-ink hover:bg-white/70"
          >
            Open public board
          </Link>
          <Link
            href="/leaderboard/live"
            className="inline-flex min-h-11 items-center rounded-lg border border-line px-4 text-sm font-medium text-ink hover:bg-white/70"
          >
            Live preview
          </Link>
          <Link
            href="/settings"
            className="inline-flex min-h-11 items-center rounded-lg border border-line px-4 text-sm font-medium text-ink hover:bg-white/70"
          >
            Settings · Phase 3
          </Link>
        </div>
      </section>

      <section className="rounded-xl border border-line bg-surface/90 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-ink">Placement &amp; cadence</h2>
        <div>
          <Label htmlFor="loc">Common-area placement</Label>
          <Input
            id="loc"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Hostel Block lobby TV"
          />
        </div>
        <div>
          <Label htmlFor="notes">Notes</Label>
          <Input
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Mount height, power, who refreshes"
          />
        </div>
        <div>
          <Label htmlFor="recog">Recognition label</Label>
          <Input
            id="recog"
            value={recognition}
            onChange={(e) => setRecognition(e.target.value)}
            disabled={s.cadence_locked}
          />
        </div>
        <div>
          <Label htmlFor="wd">Weekly refresh day</Label>
          <select
            id="wd"
            className="min-h-11 w-full rounded-lg border border-line bg-surface px-3 text-sm disabled:opacity-60"
            value={weekday}
            disabled={s.cadence_locked}
            onChange={(e) => setWeekday(Number(e.target.value))}
          >
            {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(
              (name, i) => (
                <option key={name} value={i}>
                  {name}
                </option>
              ),
            )}
          </select>
          <p className="mt-1 text-xs text-muted">
            Campus weeks are Mon–Sun. Lock after the board is live in the field.
            {s.cadence_locked && s.locked_at
              ? ` Locked ${new Date(s.locked_at).toLocaleString()}${s.locked_by ? ` by ${s.locked_by}` : ""}.`
              : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button disabled={!!busy} onClick={() => void save()}>
            Save field settings
          </Button>
          {s.cadence_locked ? (
            <Button variant="ghost" disabled={!!busy} onClick={() => void unlock()}>
              Unlock cadence
            </Button>
          ) : (
            <Button disabled={!!busy} onClick={() => void lock()}>
              Lock weekly cadence
            </Button>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-line bg-surface/90 p-5 space-y-3">
        <h2 className="text-sm font-semibold text-ink">Field checklist</h2>
        <ul className="space-y-2">
          {Object.entries(CHECK_LABELS).map(([key, label]) => (
            <li key={key}>
              <label className="flex items-start gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={Boolean(checks[key])}
                  onChange={(e) => setChecks((c) => ({ ...c, [key]: e.target.checked }))}
                />
                <span>{label}</span>
              </label>
            </li>
          ))}
        </ul>
        <Button variant="ghost" disabled={!!busy} onClick={() => void save()}>
          Save checklist
        </Button>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-ink">Three-layer attribution</h2>
          <Button variant="ghost" disabled={!!busy} onClick={() => void loadAttribution()}>
            Build from phase windows
          </Button>
        </div>
        <p className="text-sm text-muted">
          Tag Phase 1 / 2 / 3 dates on{" "}
          <Link href="/phases" className="text-brand underline-offset-2 hover:underline">
            Phases
          </Link>
          , then generate descriptive deltas for the field report.
        </p>
        {attr ? (
          <div className="space-y-3">
            <HonestyBanner text={attr.honesty} />
            {attr.layers.map((layer) => (
              <div key={layer.layer} className="rounded-xl border border-line bg-surface/90 p-4">
                <p className="text-sm font-semibold text-ink">{layer.layer}</p>
                {layer.ready ? (
                  <p className="mt-2 text-sm text-muted">
                    Intervention L/day {layer.intervention_mean_l_day_a?.toFixed(3)} →{" "}
                    {layer.intervention_mean_l_day_b?.toFixed(3)} · Control{" "}
                    {layer.control_mean_l_day_a?.toFixed(3)} → {layer.control_mean_l_day_b?.toFixed(3)}
                  </p>
                ) : (
                  <p className="mt-2 text-sm text-muted">{layer.detail}</p>
                )}
              </div>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
