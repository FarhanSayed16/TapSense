import { Droplets, CheckCircle2, Inbox, Radio } from "lucide-react";
import { cn } from "@/lib/cn";

type EmptyIcon = "water" | "success" | "device" | "default";

const icons: Record<EmptyIcon, React.ElementType> = {
  water: Droplets,
  success: CheckCircle2,
  device: Radio,
  default: Inbox,
};

const iconColors: Record<EmptyIcon, string> = {
  water: "text-brand/50",
  success: "text-ok/50",
  device: "text-brand/50",
  default: "text-muted/60",
};

export function EmptyState({
  title,
  description,
  icon = "default",
  className,
}: {
  title: string;
  description?: string;
  icon?: EmptyIcon;
  className?: string;
}) {
  const Icon = icons[icon];
  const color = iconColors[icon];

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-card border border-dashed border-line bg-surface/50 px-6 py-16 text-center",
        className,
      )}
    >
      <div className={cn("mb-4 rounded-full bg-bg-subtle p-4", color)}>
        <Icon className="h-8 w-8" strokeWidth={1.5} />
      </div>
      <p className="font-display text-lg font-semibold text-ink">{title}</p>
      {description ? (
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-secondary">{description}</p>
      ) : null}
    </div>
  );
}
