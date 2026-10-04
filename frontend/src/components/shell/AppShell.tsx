"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  Bell,
  Droplets,
  FileBarChart2,
  GanttChart,
  GitCompareArrows,
  LayoutDashboard,
  Palette,
  Radio,
  Settings,
  Trophy,
  ChevronDown,
  ChevronRight,
  X,
} from "lucide-react";
import { SidebarNavItem } from "@/components/ui/SidebarNavItem";
import { TopBar } from "@/components/shell/TopBar";
import { PageEnter } from "@/components/shell/PageEnter";
import { useAuth } from "@/components/providers/AppProviders";
import { useApiData } from "@/lib/useApiData";
import { useScale } from "@/lib/scale-context";
import { hasCap, hasFlag } from "@/lib/roles";
import { Device, locationCrumb, Overview } from "@/lib/types";

type OrgRes = {
  id: string;
  feature_flags: Record<string, boolean>;
};

const MONITOR_NAV = [
  { href: "/", label: "Overview", icon: LayoutDashboard, cap: "monitor" as const },
  { href: "/taps", label: "Taps", icon: Droplets, cap: "monitor" as const },
  { href: "/sessions", label: "Sessions", icon: Activity, cap: "monitor" as const },
  { href: "/devices", label: "Devices", icon: Radio, cap: "monitor" as const },
  { href: "/alerts", label: "Alerts", icon: Bell, cap: "monitor" as const },
];

const SCIENCE_NAV = [
  { href: "/phases", label: "Phases", icon: GanttChart },
  { href: "/compare", label: "Compare", icon: GitCompareArrows },
  { href: "/thresholds", label: "Thresholds", icon: Palette },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/reports", label: "Reports", icon: FileBarChart2 },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [scienceOpen, setScienceOpen] = useState(true);
  const [scienceTouched, setScienceTouched] = useState(false);
  const { user } = useAuth();
  const { overviewPath } = useScale();
  const { data: overview } = useApiData<Overview>(overviewPath, { refreshMs: 5000 });
  const { data: devices } = useApiData<Device[]>("/api/v1/devices", { refreshMs: 5000 });
  const { data: org } = useApiData<OrgRes>("/api/v1/org", { refreshMs: 30000 });
  const flags = org?.feature_flags;

  // Facilities / viewers start with Science collapsed; admins keep it open.
  useEffect(() => {
    if (scienceTouched || !user) return;
    setScienceOpen(user.role !== "facilities" && user.role !== "viewer");
  }, [user, scienceTouched]);

  const crumb = overview ? locationCrumb(overview.location) : "Loading location…";
  const staleDevices = (devices ?? []).filter((d) => d.status === "stale");
  const onlineCount = (devices ?? []).filter((d) => d.status === "online").length;
  const totalDevices = (devices ?? []).length;
  const showScience = hasCap(user, "science") && hasFlag(flags, "science_ui", true);

  const monitorItems = MONITOR_NAV.filter((item) => {
    if (!hasCap(user, item.cap)) return false;
    return true;
  });

  const nav = (
    <nav className="flex flex-1 flex-col gap-0.5 px-3 py-2">
      <p className="px-3 pb-1 pt-3 text-[10px] font-bold uppercase tracking-widest text-muted">
        Monitor
      </p>
      {monitorItems.map((item) => (
        <SidebarNavItem key={item.href} {...item} onNavigate={() => setOpen(false)} />
      ))}
      {showScience ? (
        <>
          <div className="my-2" />
          <button
            type="button"
            onClick={() => {
              setScienceTouched(true);
              setScienceOpen(!scienceOpen);
            }}
            className="flex w-full items-center justify-between px-3 pb-1 pt-3 text-[10px] font-bold uppercase tracking-widest text-muted hover:text-ink-secondary"
          >
            Science
            {scienceOpen ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </button>
          {scienceOpen &&
            SCIENCE_NAV.map((item) => (
              <SidebarNavItem key={item.href} {...item} onNavigate={() => setOpen(false)} />
            ))}
        </>
      ) : null}

      <div className="my-2" />
      <SidebarNavItem
        href="/settings"
        label="Settings"
        icon={Settings}
        onNavigate={() => setOpen(false)}
      />
    </nav>
  );

  return (
    <div className="min-h-screen lg:flex">
      {/* ── Desktop sidebar ── */}
      <aside className="sidebar hidden w-sidebar shrink-0 lg:flex lg:flex-col">
        <div className="px-5 py-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white">
              <Droplets className="h-4 w-4" strokeWidth={2.5} />
            </div>
            <div>
              <p className="brand text-lg font-bold tracking-tight text-ink">TapSense</p>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-muted">
            {user?.role === "facilities"
              ? "Facilities Console"
              : user?.role === "viewer"
                ? "Read-only View"
                : "Pilot Monitoring"}
          </p>
        </div>
        <div className="mx-4 border-t border-line/60" />
        {nav}
        {/* Sidebar footer: device status */}
        <div className="mx-4 mt-auto border-t border-line/60" />
        <div className="px-5 py-4">
          <div className="flex items-center gap-2 text-xs text-muted">
            <span
              className={`h-2 w-2 rounded-full ${onlineCount > 0 ? "bg-ok animate-status-pulse" : "bg-danger"}`}
            />
            <span>
              {onlineCount}/{totalDevices} device{totalDevices !== 1 ? "s" : ""} online
            </span>
          </div>
        </div>
      </aside>

      {/* ── Mobile drawer ── */}
      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute left-0 top-0 flex h-full w-72 flex-col sidebar shadow-xl animate-page-enter">
            <div className="flex items-center justify-between px-5 py-5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white">
                  <Droplets className="h-4 w-4" strokeWidth={2.5} />
                </div>
                <p className="brand text-lg font-bold text-ink">TapSense</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-muted hover:bg-white/60 hover:text-ink"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mx-4 border-t border-line/60" />
            {nav}
          </aside>
        </div>
      ) : null}

      {/* ── Main content ── */}
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          crumb={crumb}
          phaseLabel={overview?.phase_label}
          onMenu={() => setOpen(true)}
          onlineCount={onlineCount}
          totalDevices={totalDevices}
        />
        {/* Stale device warning — kept, but refined */}
        {staleDevices.length > 0 ? (
          <div className="border-b border-warn/20 bg-warn-bg/50 px-4 py-2.5 text-sm text-warn sm:px-6">
            <span className="font-semibold">
              {staleDevices.length === 1
                ? "1 device is stale"
                : `${staleDevices.length} devices are stale`}
            </span>
            {" — "}check washroom WiFi / ESP power.{" "}
            <Link href="/alerts" className="font-semibold underline underline-offset-2">
              View alerts
            </Link>
          </div>
        ) : null}
        <main className="mx-auto w-full max-w-admin flex-1 px-5 py-8 sm:px-8">
          <PageEnter>{children}</PageEnter>
        </main>
      </div>
    </div>
  );
}
