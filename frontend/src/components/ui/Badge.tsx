import { cn } from "@/lib/cn";

type Kind = "control" | "phase" | "status" | "neutral" | "warn" | "danger" | "info";

const styles: Record<Kind, string> = {
  control: "badge-control",
  phase: "badge-phase",
  status: "badge-online",
  warn: "badge-warn",
  danger: "badge-danger",
  info: "badge-info",
  neutral: "bg-slate-50 text-ink-secondary border border-slate-200",
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
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
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
  showLabel = true,
}: {
  status: "online" | "stale" | "unknown" | "offline";
  showLabel?: boolean;
}) {
  const dotColor =
    status === "online"
      ? "bg-ok"
      : status === "stale"
        ? "bg-warn"
        : status === "offline"
          ? "bg-danger"
          : "bg-control";

  const labelColor =
    status === "online"
      ? "text-ok"
      : status === "stale"
        ? "text-warn"
        : status === "offline"
          ? "text-danger"
          : "text-muted";

  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={cn(
          "h-2 w-2 rounded-full",
          dotColor,
          status === "online" && "animate-status-pulse",
        )}
      />
      {showLabel && (
        <span className={cn("text-xs font-medium capitalize", labelColor)}>
          {status}
        </span>
      )}
    </span>
  );
}
