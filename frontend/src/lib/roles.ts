import type { AuthUser } from "./auth-storage";

export type Cap =
  | "monitor"
  | "alerts_manage"
  | "science"
  | "admin"
  | "members"
  | "flags"
  | "write_registry"
  | "reset"
  | "calibrate";

export function hasCap(user: AuthUser | null | undefined, cap: Cap): boolean {
  if (!user) return false;
  const caps = user.capabilities ?? [];
  return caps.includes(cap);
}

export function hasFlag(
  flags: Record<string, boolean> | null | undefined,
  key: string,
  fallback = true,
): boolean {
  if (!flags || !(key in flags)) return fallback;
  return Boolean(flags[key]);
}
