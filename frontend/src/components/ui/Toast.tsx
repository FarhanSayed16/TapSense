"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "@/lib/cn";

type ToastItem = { id: number; message: string; tone: "ok" | "danger" | "neutral" };

type ToastContextValue = {
  push: (message: string, tone?: ToastItem["tone"]) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const icons = {
  ok: <CheckCircle2 className="h-4 w-4 shrink-0 text-ok" />,
  danger: <AlertTriangle className="h-4 w-4 shrink-0 text-danger" />,
  neutral: <Info className="h-4 w-4 shrink-0 text-info" />,
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((message: string, tone: ToastItem["tone"] = "neutral") => {
    const id = Date.now();
    setItems((prev) => [...prev, { id, message, tone }]);
    window.setTimeout(() => dismiss(id), 3200);
  }, [dismiss]);

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-50 flex w-80 flex-col gap-2">
        {items.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium shadow-card backdrop-blur-sm animate-metric-settle",
              t.tone === "ok" && "border-ok/20 bg-ok-bg text-ok",
              t.tone === "danger" && "border-danger/20 bg-danger-bg text-danger",
              t.tone === "neutral" && "border-line bg-surface text-ink",
            )}
          >
            {icons[t.tone]}
            <span className="flex-1">{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              className="shrink-0 rounded-md p-0.5 opacity-60 hover:opacity-100"
              aria-label="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast requires ToastProvider");
  return ctx;
}
