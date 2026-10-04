"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BoardView, BoardPayload } from "@/components/leaderboard/BoardView";
import { ApiError, apiFetch } from "@/lib/api";

export default function LeaderboardLivePage() {
  const [data, setData] = useState<BoardPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const snap = await apiFetch<BoardPayload>(
          "/api/v1/leaderboard/boards/board_pilot/snapshot",
        );
        if (!cancelled) {
          setData({ ...snap, brand: "TapSense" });
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Failed to load board");
        }
      }
    };
    void load();
    const id = window.setInterval(() => void load(), 15000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-slate-950">
      <div className="absolute right-4 top-4 z-10 flex gap-2">
        <Link
          href="/leaderboard"
          className="rounded-lg border border-white/20 bg-black/40 px-3 py-2 text-xs text-white/80 backdrop-blur hover:bg-black/60"
        >
          ← Admin
        </Link>
        <Link
          href="/leaderboard/public/board_pilot"
          className="rounded-lg border border-white/20 bg-black/40 px-3 py-2 text-xs text-white/80 backdrop-blur hover:bg-black/60"
        >
          Public
        </Link>
      </div>
      {error ? (
        <div className="flex min-h-screen items-center justify-center px-6 text-center text-white">
          <p>{error}</p>
        </div>
      ) : data ? (
        <BoardView data={data} variant="public" className="min-h-screen" />
      ) : (
        <div className="flex min-h-screen items-center justify-center text-white/60">Loading…</div>
      )}
    </div>
  );
}
