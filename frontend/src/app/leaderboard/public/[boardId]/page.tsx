"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { BoardView, BoardPayload } from "@/components/leaderboard/BoardView";
import { ApiError, apiFetch } from "@/lib/api";

/**
 * Public wall/TV board — no admin chrome, auto-refresh, brand persistent.
 */
export default function PublicLeaderboardPage() {
  const params = useParams<{ boardId: string }>();
  const boardId = params.boardId;
  const [data, setData] = useState<BoardPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!boardId) return;
    let cancelled = false;
    const load = async () => {
      try {
        const snap = await apiFetch<BoardPayload>(
          `/api/v1/public/leaderboard/${boardId}`,
          { auth: false },
        );
        if (!cancelled) {
          setData(snap);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Board unavailable");
        }
      }
    };
    void load();
    const id = window.setInterval(() => void load(), 20000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [boardId]);

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-center text-white">
        <div>
          <p className="brand text-2xl font-semibold">TapSense</p>
          <p className="mt-3 text-white/60">{error}</p>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white/60">
        Loading board…
      </main>
    );
  }

  return <BoardView data={data} variant="public" className="min-h-screen" />;
}
