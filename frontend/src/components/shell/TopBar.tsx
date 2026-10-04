"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, Menu, LogOut, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/components/providers/AppProviders";
import { useScale } from "@/lib/scale-context";
import { useApiData } from "@/lib/useApiData";

type BuildingsRes = {
  buildings: { id: string; name: string; tap_count?: number }[];
};

type AlertsRes = { count: number; alerts: unknown[] };

export function TopBar({
  crumb,
  phaseLabel,
  onMenu,
  onlineCount,
  totalDevices,
}: {
  crumb: string;
  phaseLabel?: string | null;
  onMenu: () => void;
  onlineCount?: number;
  totalDevices?: number;
}) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { buildingId, setBuildingId } = useScale();
  const buildings = useApiData<BuildingsRes>("/api/v1/locations/buildings");
  const alerts = useApiData<AlertsRes>("/api/v1/alerts?refresh=true&open_only=true", {
    refreshMs: 15000,
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Quietly keep scale context pointed at the pilot building (no switcher in chrome).
  useEffect(() => {
    const list = buildings.data?.buildings ?? [];
    if (list.length === 0) return;
    if (list.some((b) => b.id === buildingId)) return;
    const fallback = list[0]?.id;
    if (fallback) setBuildingId(fallback);
  }, [buildings.data, buildingId, setBuildingId]);

  useEffect(() => {
    if (!menuOpen) return;
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const initials = (user?.name ?? "A")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const openAlerts = alerts.data?.count ?? alerts.data?.alerts?.length ?? 0;

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-admin items-center gap-3 px-5 py-3 sm:px-8">
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-line hover:bg-bg-subtle lg:hidden"
          onClick={onMenu}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5 text-ink-secondary" />
        </button>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink">{crumb}</p>
          <div className="mt-0.5 flex items-center gap-3 text-xs text-muted">
            <Badge kind="phase" className="text-[10px]">
              {phaseLabel ?? "Phase 0 — Baseline"}
            </Badge>
            {onlineCount !== undefined && totalDevices !== undefined && (
              <span className="hidden items-center gap-1.5 sm:inline-flex">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${onlineCount > 0 ? "bg-ok" : "bg-danger"}`}
                />
                {onlineCount}/{totalDevices} online
              </span>
            )}
          </div>
        </div>

        <Link
          href="/alerts"
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg border border-line text-ink-secondary transition-colors hover:bg-bg-subtle hover:text-ink"
          aria-label={openAlerts > 0 ? `${openAlerts} open alerts` : "Alerts"}
          title={openAlerts > 0 ? `${openAlerts} open alerts` : "Alerts"}
        >
          <Bell className="h-[18px] w-[18px]" />
          {openAlerts > 0 ? (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
              {openAlerts > 9 ? "9+" : openAlerts}
            </span>
          ) : null}
        </Link>

        <div className="relative hidden sm:block" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-wash text-xs font-bold text-brand-strong transition-shadow hover:shadow-md"
            aria-label="User menu"
          >
            {initials}
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-line bg-surface p-1.5 shadow-lg animate-metric-settle">
              <div className="px-3 py-2">
                <p className="text-sm font-semibold text-ink">{user?.name ?? "Admin"}</p>
                <p className="text-xs text-muted">{user?.email ?? ""}</p>
              </div>
              <div className="my-1 border-t border-line" />
              <Link
                href="/settings"
                onClick={() => setMenuOpen(false)}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink-secondary hover:bg-bg-subtle hover:text-ink"
              >
                <Settings className="h-4 w-4" />
                Settings
              </Link>
              <button
                type="button"
                onClick={async () => {
                  setMenuOpen(false);
                  await logout();
                  router.replace("/login");
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-danger hover:bg-danger-bg"
              >
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
