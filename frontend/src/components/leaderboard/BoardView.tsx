"use client";

import { cn } from "@/lib/cn";

export type BoardRank = {
  rank: number;
  name: string;
  liters: number;
};

export type BoardPayload = {
  board_id?: string;
  title: string;
  subtitle?: string | null;
  week_start: string;
  week_end: string;
  timezone?: string;
  recognition?: string;
  winner?: { name: string; liters: number; rank?: number } | null;
  ranks: BoardRank[];
  generated_at?: string | null;
  brand?: string;
  social_phase?: boolean;
};

export function BoardView({
  data,
  variant = "public",
  className,
}: {
  data: BoardPayload;
  variant?: "public" | "admin";
  className?: string;
}) {
  const isPublic = variant === "public";

  return (
    <div
      className={cn(
        "flex min-h-full flex-col",
        isPublic
          ? "bg-slate-950 text-white"
          : "rounded-xl border border-line bg-surface/90 text-ink",
        className,
      )}
    >
      <header
        className={cn(
          "px-6 py-8 sm:px-10",
          isPublic ? "border-b border-white/10" : "border-b border-line",
        )}
      >
        <p
          className={cn(
            "brand text-sm font-semibold tracking-[0.18em] uppercase",
            isPublic ? "text-[color:var(--leaderboard-gold)]" : "text-brand",
          )}
        >
          {data.brand ?? "TapSense"}
        </p>
        <h1
          className={cn(
            "brand mt-2 font-semibold tracking-tight",
            isPublic ? "text-4xl sm:text-5xl md:text-6xl" : "text-2xl",
          )}
        >
          {data.title}
        </h1>
        {data.subtitle ? (
          <p className={cn("mt-2 max-w-2xl", isPublic ? "text-white/60" : "text-muted")}>
            {data.subtitle}
          </p>
        ) : null}
        <p className={cn("mono mt-4 text-sm", isPublic ? "text-white/45" : "text-muted")}>
          Week {data.week_start} → {data.week_end}
          {data.timezone ? ` · ${data.timezone}` : ""}
        </p>
      </header>

      {data.winner ? (
        <section
          className={cn(
            "mx-6 mt-8 rounded-2xl px-6 py-5 sm:mx-10",
            isPublic
              ? "border border-[color:var(--leaderboard-gold)]/40 bg-[color:var(--leaderboard-gold)]/10"
              : "border border-amber-200 bg-amber-50/80",
          )}
        >
          <p
            className={cn(
              "text-xs font-semibold uppercase tracking-[0.16em]",
              isPublic ? "text-[color:var(--leaderboard-gold)]" : "text-warn",
            )}
          >
            {data.recognition ?? "Lowest use this week"}
          </p>
          <p className={cn("brand mt-2 text-3xl font-semibold sm:text-4xl", isPublic && "text-white")}>
            {data.winner.name}
          </p>
          <p className={cn("mono mt-1 text-lg", isPublic ? "text-white/70" : "text-muted")}>
            {data.winner.liters.toFixed(2)} L
          </p>
        </section>
      ) : (
        <p className={cn("px-6 pt-8 text-sm sm:px-10", isPublic ? "text-white/50" : "text-muted")}>
          No ranked entries for this week yet.
        </p>
      )}

      <ol className="mt-8 flex-1 space-y-3 px-6 pb-10 sm:px-10">
        {data.ranks.map((row, i) => (
          <li
            key={`${row.rank}-${row.name}`}
            className={cn(
              "flex items-center gap-4 rounded-xl px-4 py-4 transition-transform duration-500",
              isPublic ? "bg-white/5" : "border border-line bg-white/70",
              row.rank === 1 && (isPublic ? "ring-1 ring-[color:var(--leaderboard-gold)]/50" : ""),
            )}
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <span
              className={cn(
                "brand flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-xl font-semibold",
                row.rank === 1
                  ? isPublic
                    ? "bg-[color:var(--leaderboard-gold)]/20 text-[color:var(--leaderboard-gold)]"
                    : "bg-amber-100 text-warn"
                  : isPublic
                    ? "bg-white/10 text-white/80"
                    : "bg-cyan-50 text-brand-strong",
              )}
            >
              {row.rank}
            </span>
            <div className="min-w-0 flex-1">
              <p className={cn("truncate text-lg font-medium sm:text-xl", isPublic && "text-white")}>
                {row.name}
              </p>
            </div>
            <p className={cn("mono text-lg font-medium sm:text-2xl", isPublic ? "text-white/90" : "text-ink")}>
              {row.liters.toFixed(2)}
              <span className={cn("ml-1 text-sm", isPublic ? "text-white/45" : "text-muted")}>L</span>
            </p>
          </li>
        ))}
      </ol>

      <footer
        className={cn(
          "px-6 py-4 text-xs sm:px-10",
          isPublic ? "border-t border-white/10 text-white/35" : "border-t border-line text-muted",
        )}
      >
        Quiet recognition · no shame copy · tap / zone totals only · never person IDs
        {data.generated_at ? ` · updated ${new Date(data.generated_at).toLocaleString()}` : ""}
      </footer>
    </div>
  );
}
