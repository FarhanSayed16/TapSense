"use client";

import { Menu } from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/components/providers/AppProviders";

export function TopBar({
  crumb,
  onMenu,
}: {
  crumb: string;
  onMenu: () => void;
}) {
  const { user, logout } = useAuth();
  const router = useRouter();

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/85 backdrop-blur">
      <div className="mx-auto flex max-w-admin items-center gap-3 px-4 py-3 sm:px-6">
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-line lg:hidden"
          onClick={onMenu}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="min-w-0 flex-1">
          <p className="truncate text-xs text-muted sm:text-sm">{crumb}</p>
        </div>

        <Badge kind="phase">Phase 0 — Baseline</Badge>

        <div className="hidden items-center gap-2 sm:flex">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-50 text-xs font-semibold text-brand-strong">
            {(user?.name ?? "A")
              .split(" ")
              .map((p) => p[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <Button
            variant="ghost"
            className="min-h-9 px-3"
            onClick={async () => {
              await logout();
              router.replace("/login");
            }}
          >
            Log out
          </Button>
        </div>
      </div>
    </header>
  );
}
