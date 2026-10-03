import { cn } from "@/lib/cn";

type Kind = "control" | "phase" | "status" | "neutral";

const styles: Record<Kind, string> = {
  control: "bg-slate-100 text-control border-slate-200",
  phase: "bg-cyan-50 text-brand-strong border-cyan-100",
  status: "bg-emerald-50 text-ok border-emerald-100",
  neutral: "bg-white text-muted border-line",
};

export function Badge({
  children,
  kind = "neutral",
  className,
}: {
  children: React.ReactNode;
  kind?: Kind;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        styles[kind],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function StatusDot({
  status,
}: {
  status: "online" | "stale" | "unknown" | "offline";
}) {
  const color =
    status === "online"
      ? "bg-accent"
      : status === "stale"
        ? "bg-warn"
        : status === "offline"
          ? "bg-danger"
          : "bg-control";
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted">
      <span
        className={cn(
          "h-2 w-2 rounded-full",
          color,
          status === "online" && "animate-status-pulse",
        )}
      />
      {status}
    </span>
  );
}
