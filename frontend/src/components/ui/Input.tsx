import { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Label({
  children,
  htmlFor,
}: {
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-ink">
      {children}
    </label>
  );
}

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "min-h-11 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-accent/30",
        className,
      )}
      {...props}
    />
  );
}
