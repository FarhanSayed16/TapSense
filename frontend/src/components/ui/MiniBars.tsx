"use client";

import { cn } from "@/lib/cn";

export function MiniBars({
  points,
  className,
  thresholdLiters,
  compact = false,
  showAxis = true,
  barClassName,
}: {
  points: { date: string; liters: number }[];
  className?: string;
  /** Optional session/day threshold line for Phase 16 overlay (liters). */
  thresholdLiters?: number | null;
  /** Compact sparkline mode for tap cards / table cells. */
  compact?: boolean;
  /** Show date labels + max axis hint (ignored when compact). */
  showAxis?: boolean;
  barClassName?: string;
}) {
  const max = Math.max(
    ...points.map((p) => p.liters),
    thresholdLiters && thresholdLiters > 0 ? thresholdLiters : 0,
    0.001,
  );
  const allZero = points.every((p) => p.liters === 0);

  if (points.length === 0) {
    return (
      <p className="text-sm text-muted">No daily totals yet for this range.</p>
    );
  }

  const thresholdPct =
    thresholdLiters && thresholdLiters > 0
      ? Math.min(100, (thresholdLiters / max) * 100)
      : null;

  if (compact) {
    return (
      <div
        className={cn("flex h-8 items-end gap-0.5", className)}
        aria-hidden={!allZero}
        title={
          allZero
            ? "No weekly activity yet"
            : points.map((p) => `${p.date.slice(5)}: ${p.liters.toFixed(2)} L`).join(" · ")
        }
      >
        {points.map((p) => (
          <div
            key={p.date}
            className={cn(
              "min-w-0 flex-1 rounded-sm",
              p.liters > 0 ? "bg-brand/70" : "bg-line/80",
              barClassName,
            )}
            style={{
              height: `${Math.max(p.liters > 0 ? 18 : 10, (p.liters / max) * 100)}%`,
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-end gap-3">
        {showAxis ? (
          <div className="flex h-44 w-11 shrink-0 flex-col justify-between py-1 text-right text-[10px] text-muted">
            <span>{max >= 10 ? max.toFixed(0) : max.toFixed(1)} L</span>
            <span>{(max / 2).toFixed(max >= 10 ? 0 : 1)}</span>
            <span>0</span>
          </div>
        ) : null}

        <div className="relative min-w-0 flex-1">
          {/* Ghost grid — behind bars */}
          <div className="pointer-events-none absolute inset-0 flex flex-col justify-between py-1">
            <div className="border-t border-line" />
            <div className="border-t border-dashed border-line/70" />
            <div className="border-t border-line" />
          </div>

          <div className="relative flex h-44 items-end gap-2 px-0.5">
            {thresholdPct != null ? (
              <div
                className="pointer-events-none absolute inset-x-0 z-[1] border-t border-dashed border-amber-500/80"
                style={{ bottom: `${thresholdPct}%` }}
                title={`Threshold ${thresholdLiters!.toFixed(2)} L`}
              />
            ) : null}

            {points.map((p) => {
              const over =
                thresholdLiters != null &&
                thresholdLiters > 0 &&
                p.liters >= thresholdLiters;
              // Height relative to track only — never share flex space with labels.
              const heightPct = allZero
                ? 6
                : p.liters > 0
                  ? Math.max(10, (p.liters / max) * 100)
                  : 3;

              return (
                <div
                  key={p.date}
                  className="group relative flex h-full min-w-0 flex-1 items-end"
                  title={`${p.date}: ${p.liters.toFixed(2)} L`}
                >
                  {/* Absolute hover value — does NOT collapse bar height */}
                  {p.liters > 0 ? (
                    <span className="pointer-events-none absolute -top-5 left-1/2 z-[2] -translate-x-1/2 whitespace-nowrap rounded bg-ink px-1.5 py-0.5 text-[10px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                      {p.liters.toFixed(2)} L
                    </span>
                  ) : null}
                  <div
                    className={cn(
                      "w-full max-w-[48px] mx-auto rounded-t-md",
                      allZero
                        ? "bg-line"
                        : over
                          ? "bg-amber-500/85"
                          : "bg-brand",
                      p.liters > 0 && "shadow-sm",
                      barClassName,
                    )}
                    style={{ height: `${heightPct}%` }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {showAxis ? (
        <div className={cn("flex gap-2", "pl-[52px]")}>
          {points.map((p) => (
            <p
              key={p.date}
              className="min-w-0 flex-1 truncate text-center text-[11px] text-muted"
            >
              {p.date.slice(5)}
            </p>
          ))}
        </div>
      ) : null}

      {thresholdPct != null ? (
        <p className="text-xs text-muted">
          Dashed line = session threshold {thresholdLiters!.toFixed(2)} L
        </p>
      ) : null}
    </div>
  );
}
