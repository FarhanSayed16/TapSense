"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

export function KpiStat({
  label,
  value,
  hint,
  trend,
  className,
}: {
  label: string;
  value: string | number;
  hint?: string;
  trend?: { direction: "up" | "down" | "flat"; text: string } | null;
  className?: string;
}) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div
      className={cn(
        "card kpi-card p-5",
        ready && "animate-metric-settle",
        className,
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">
        {label}
      </p>
      <p className="kpi-value mt-2 text-3xl text-ink">{value}</p>
      {trend ? (
        <p
          className={cn(
            "mt-1.5 text-xs font-medium",
            trend.direction === "up" ? "text-ok" : trend.direction === "down" ? "text-danger" : "text-muted",
          )}
        >
          {trend.direction === "up" ? "↑" : trend.direction === "down" ? "↓" : "→"}{" "}
          {trend.text}
        </p>
      ) : null}
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}
