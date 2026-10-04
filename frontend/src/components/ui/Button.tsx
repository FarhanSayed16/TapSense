import { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const styles: Record<Variant, string> = {
  primary:
    "bg-brand text-white hover:bg-brand-strong shadow-sm border border-transparent active:scale-[0.97]",
  secondary:
    "btn-secondary active:scale-[0.97]",
  ghost:
    "bg-transparent text-ink-secondary hover:bg-white/80 hover:text-ink border border-line",
  danger:
    "bg-danger text-white hover:brightness-90 border border-transparent active:scale-[0.97]",
};

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-5 text-sm font-semibold transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50",
        styles[variant],
        className,
      )}
      {...props}
    />
  );
}
