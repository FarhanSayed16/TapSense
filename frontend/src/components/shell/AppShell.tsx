"use client";

import { useState } from "react";
import {
  Activity,
  Droplets,
  LayoutDashboard,
  Radio,
  Settings,
} from "lucide-react";
import { SidebarNavItem } from "@/components/ui/SidebarNavItem";
import { TopBar } from "@/components/shell/TopBar";
import { PageEnter } from "@/components/shell/PageEnter";
import { useApiData } from "@/lib/useApiData";
import { Device, locationCrumb, Overview } from "@/lib/types";

const NAV = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/taps", label: "Taps", icon: Droplets },
  { href: "/sessions", label: "Sessions", icon: Activity },
  { href: "/device", label: "Device", icon: Radio },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const { data: overview } = useApiData<Overview>("/api/v1/overview", { refreshMs: 5000 });
  const { data: device } = useApiData<Device>("/api/v1/devices/device_01", { refreshMs: 5000 });

  const crumb = overview ? locationCrumb(overview.location) : "Loading location…";
  const stale = device?.status === "stale";

  const nav = (
    <nav className="flex flex-1 flex-col gap-1 p-3">
      {NAV.slice(0, 4).map((item) => (
        <SidebarNavItem
          key={item.href}
          {...item}
          onNavigate={() => setOpen(false)}
        />
      ))}
      <div className="my-3 border-t border-line" />
      <SidebarNavItem {...NAV[4]} onNavigate={() => setOpen(false)} />
    </nav>
  );

  return (
    <div className="min-h-screen lg:flex">
      <aside className="hidden w-sidebar shrink-0 border-r border-line bg-surface/80 lg:flex lg:flex-col">
        <div className="border-b border-line px-4 py-5">
          <p className="brand text-xl font-semibold tracking-tight text-ink">TapSense</p>
          <p className="mt-1 text-xs text-muted">Pilot monitoring</p>
        </div>
        {nav}
      </aside>

      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            className="absolute inset-0 bg-ink/30"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute left-0 top-0 flex h-full w-72 flex-col border-r border-line bg-surface shadow-lg animate-page-enter">
            <div className="border-b border-line px-4 py-5">
              <p className="brand text-xl font-semibold text-ink">TapSense</p>
            </div>
            {nav}
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar crumb={crumb} onMenu={() => setOpen(true)} />
        {stale ? (
          <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-warn sm:px-6">
            Device {device?.id ?? "device_01"} is {device?.status ?? "unknown"}
            {device?.last_seen_at
              ? ` · last seen ${new Date(device.last_seen_at).toLocaleString()}`
              : " · no telemetry yet"}
            . Check washroom WiFi / ESP power.
          </div>
        ) : null}
        <main className="mx-auto w-full max-w-admin flex-1 px-4 py-6 sm:px-6">
          <PageEnter>{children}</PageEnter>
        </main>
      </div>
    </div>
  );
}
