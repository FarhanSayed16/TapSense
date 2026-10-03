"use client";

import { cn } from "@/lib/cn";

export function MiniBars({
  points,
  className,
}: {
  points: { date: string; liters: number }[];
  className?: string;
}) {
  const max = Math.max(...points.map((p) => p.liters), 0.001);

  if (points.length === 0) {
    return (
      <p className="text-sm text-muted">No daily totals yet for this range.</p>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex h-36 items-end gap-1.5">
        {points.map((p) => (
          <div key={p.date} className="flex h-full flex-1 flex-col justify-end">
            <div
              className="w-full rounded-t-md bg-brand/80 transition-all"
              style={{ height: `${Math.max(6, (p.liters / max) * 100)}%` }}
              title={`${p.date}: ${p.liters.toFixed(2)} L`}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-1.5">
        {points.map((p) => (
          <p key={p.date} className="mono flex-1 truncate text-center text-[10px] text-muted">
            {p.date.slice(5)}
          </p>
        ))}
      </div>
    </div>
  );
}
