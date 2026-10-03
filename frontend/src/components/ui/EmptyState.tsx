import { Inbox } from "lucide-react";
import { cn } from "@/lib/cn";

export function EmptyState({
  title,
  description,
  className,
}: {
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-line bg-surface/60 px-6 py-14 text-center",
        className,
      )}
    >
      <Inbox className="mb-3 h-8 w-8 text-brand/70" strokeWidth={1.5} />
      <p className="font-display text-lg font-semibold text-ink">{title}</p>
      {description ? <p className="mt-1 max-w-md text-sm text-muted">{description}</p> : null}
    </div>
  );
}
