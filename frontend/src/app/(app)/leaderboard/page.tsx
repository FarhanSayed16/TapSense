"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ExternalLink, RefreshCw, Trophy } from "lucide-react";
import { BoardView, BoardPayload } from "@/components/leaderboard/BoardView";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { ErrorRetry, LoadingBlock } from "@/components/ui/QueryState";
import { ApiError, apiFetch } from "@/lib/api";
import { useApiData } from "@/lib/useApiData";

type BoardConfig = {
  id: string;
  title: string;
  subtitle?: string;
  scope: "tap" | "zone" | "floor" | "building";
  exclude_control: boolean;
  public: boolean;
  enabled: boolean;
  building_id?: string | null;
};

type Snapshot = BoardPayload & {
  board_id: string;
  scope: string;
  exclude_control: boolean;
  entry_count: number;
  honesty?: string;
  ranks: (BoardPayload["ranks"][number] & {
    entity_id?: string;
    session_count?: number;
    is_control?: boolean;
  })[];
};

export default function LeaderboardAdminPage() {
  const boards = useApiData<{ boards: BoardConfig[] }>("/api/v1/leaderboard/boards");
  const board = boards.data?.boards?.[0];
  const boardId = board?.id ?? "board_pilot";

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [scope, setScope] = useState<BoardConfig["scope"]>("tap");
  const [excludeControl, setExcludeControl] = useState(true);
  const [isPublic, setIsPublic] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [snap, setSnap] = useState<Snapshot | null>(null);

  useEffect(() => {
    if (!board) return;
    setTitle(board.title);
    setSubtitle(board.subtitle ?? "");
    setScope(board.scope);
    setExcludeControl(board.exclude_control);
    setIsPublic(board.public);
  }, [board]);

  const loadSnap = async (refresh = false) => {
    setBusy(refresh ? "refresh" : "load");
    setMsg(null);
    try {
      const path = `/api/v1/leaderboard/boards/${boardId}/snapshot${refresh ? "?refresh=true" : ""}`;
      const data = await apiFetch<Snapshot>(path);
      setSnap(data);
      if (refresh) setMsg("Snapshot rebuilt from weekly aggregates.");
    } catch (err) {
      setMsg(err instanceof ApiError ? err.message : "Snapshot failed");
    } finally {
      setBusy(null);
    }
  };

  useEffect(() => {
    if (board) void loadSnap(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load when board id ready
  }, [boardId, !!board]);

  const save = async () => {
    setBusy("save");
    setMsg(null);
    try {
      await apiFetch(`/api/v1/leaderboard/boards/${boardId}`, {
        method: "PATCH",
        body: JSON.stringify({
          title,
          subtitle,
          scope,
          exclude_control: excludeControl,
          public: isPublic,
        }),
      });
      setMsg("Board settings saved.");
      void boards.reload();
      await loadSnap(true);
    } catch (err) {
      setMsg(err instanceof ApiError ? err.message : "Save failed");
    } finally {
      setBusy(null);
    }
  };

  if (boards.loading && !boards.data) return <LoadingBlock />;
  if (boards.error && !boards.data) {
    return <ErrorRetry message={boards.error} onRetry={() => void boards.reload()} />;
  }

  const publicPath = `/leaderboard/public/${boardId}`;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight text-ink">Leaderboard</h1>
          <p className="mt-1 text-sm text-ink-secondary">
            Configure weekly social-norm board. Lowest use wins quiet recognition.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={publicPath} target="_blank">
            <Button variant="secondary" className="min-h-9 text-xs">
              <ExternalLink className="h-3.5 w-3.5" />
              Public Board
            </Button>
          </Link>
        </div>
      </div>

      {msg ? (
        <div className="callout text-sm text-ink-secondary">{msg}</div>
      ) : null}

      {/* ── Board Settings ── */}
      <section className="card p-6 space-y-5">
        <div className="flex items-center gap-2.5">
          <Trophy className="h-5 w-5 text-brand" />
          <h2 className="text-base font-semibold text-ink">Board Settings</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="subtitle">Subtitle</Label>
            <Input
              id="subtitle"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Lowest use earns quiet recognition"
            />
          </div>
          <div>
            <Label htmlFor="scope">Scope</Label>
            <select
              id="scope"
              className="min-h-12 w-full rounded-xl border border-line bg-surface px-4 text-sm text-ink outline-none transition-all duration-150 focus:border-brand focus:ring-2 focus:ring-brand/20"
              value={scope}
              onChange={(e) => setScope(e.target.value as BoardConfig["scope"])}
            >
              <option value="tap">Tap (pilot channels)</option>
              <option value="zone">Zone</option>
              <option value="floor">Floor</option>
              <option value="building">Building</option>
            </select>
          </div>
          <div className="flex flex-col justify-end gap-3 pb-1">
            <label className="flex items-center gap-2.5 text-sm text-ink cursor-pointer">
              <input
                type="checkbox"
                checked={excludeControl}
                onChange={(e) => setExcludeControl(e.target.checked)}
                className="h-4 w-4 rounded border-line text-brand accent-brand"
              />
              Exclude control tap from ranking
            </label>
            <label className="flex items-center gap-2.5 text-sm text-ink cursor-pointer">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="h-4 w-4 rounded border-line text-brand accent-brand"
              />
              Public wall board enabled
            </label>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 border-t border-line pt-4">
          <Button disabled={!!busy} onClick={() => void save()}>
            Save & Refresh
          </Button>
          <Button variant="secondary" disabled={!!busy} onClick={() => void loadSnap(true)}>
            <RefreshCw className="h-3.5 w-3.5" />
            Rebuild Snapshot
          </Button>
          <Link href="/leaderboard/live">
            <Button variant="ghost">Live Preview</Button>
          </Link>
        </div>
      </section>

      {/* ── Honesty Note ── */}
      {snap?.honesty ? (
        <div className="callout callout-warn text-sm text-ink-secondary">
          <em>{snap.honesty}</em>
        </div>
      ) : null}

      {/* ── Board Preview ── */}
      {snap ? (
        <section>
          <h2 className="mb-4 text-base font-semibold text-ink">Preview</h2>
          <BoardView data={{ ...snap, brand: "TapSense" }} variant="admin" />
        </section>
      ) : (
        <p className="text-sm text-muted">Loading snapshot…</p>
      )}
    </div>
  );
}
