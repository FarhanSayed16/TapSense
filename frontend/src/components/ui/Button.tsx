import { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "ghost" | "danger";

const styles: Record<Variant, string> = {
  primary:
    "bg-brand text-white hover:bg-brand-strong shadow-sm border border-transparent",
  ghost:
    "bg-transparent text-ink hover:bg-white/70 border border-line",
  danger:
    "bg-danger text-white hover:bg-red-700 border border-transparent",
};

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        styles[variant],
        className,
      )}
      {...props}
    />
  );
}
