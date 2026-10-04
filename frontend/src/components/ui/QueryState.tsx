"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";

export function LoadingBlock({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-4 animate-page-enter">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-20 w-full rounded-card" />
      ))}
    </div>
  );
}

export function ErrorRetry({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="card border-danger/20 px-6 py-8 text-center animate-page-enter">
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-danger-bg">
        <AlertTriangle className="h-5 w-5 text-danger" />
      </div>
      <p className="text-sm font-semibold text-danger">{message}</p>
      <Button variant="ghost" className="mx-auto mt-4 min-h-9" onClick={onRetry}>
        <RefreshCw className="h-3.5 w-3.5" />
        Retry
      </Button>
    </div>
  );
}
