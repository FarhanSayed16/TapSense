"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export function SidebarNavItem({
  href,
  label,
  icon: Icon,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const active =
    href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "sidebar-nav-item flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium",
        active
          ? "sidebar-nav-active"
          : "text-ink-secondary hover:text-ink",
      )}
    >
      <Icon
        className={cn("h-[18px] w-[18px] shrink-0", active ? "text-brand" : "text-muted")}
        strokeWidth={active ? 2 : 1.75}
      />
      {label}
    </Link>
  );
}
