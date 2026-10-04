"use client";

import { FormEvent, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Droplets } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { useAuth } from "@/components/providers/AppProviders";
import { useToast } from "@/components/ui/Toast";
import { PageEnter } from "@/components/shell/PageEnter";

/* Lazy-load the Lottie player — canvas/WASM, client-only */
const UnderwaterLottie = dynamic(
  () =>
    import("@/components/ui/UnderwaterLottie").then((m) => m.UnderwaterLottie),
  { ssr: false },
);

export default function LoginPage() {
  const { login, user, ready } = useAuth();
  const router = useRouter();
  const { push } = useToast();
  const [email, setEmail] = useState("admin@tapsense.app");
  const [password, setPassword] = useState("TapSenseAdmin123!");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (ready && user) router.replace("/");
  }, [ready, user, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      push("Signed in", "ok");
      router.replace("/");
    } catch (err) {
      push(err instanceof Error ? err.message : "Login failed", "danger");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen overflow-hidden bg-[#F4F7FA]">
      {/* ── Left: full-bleed Lottie (desktop) ── */}
      <aside className="relative hidden w-[52%] overflow-hidden lg:block">
        <div className="absolute inset-0 bg-[#0a2740]" />
        <UnderwaterLottie />

        {/* Soft edge into the form — no heavy black wash over the scene */}
        <div className="pointer-events-none absolute inset-y-0 right-0 z-[2] w-24 bg-gradient-to-l from-[#F4F7FA]/25 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-40 bg-gradient-to-t from-black/45 via-black/15 to-transparent" />

        {/* Quiet brand lockup — not a card, not pill soup */}
        <div className="absolute inset-x-0 bottom-0 z-[3] px-10 pb-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/25 backdrop-blur-sm">
              <Droplets className="h-5 w-5 text-white" strokeWidth={2.25} />
            </div>
            <div>
              <p className="brand text-2xl font-bold tracking-tight text-white">
                TapSense
              </p>
              <p className="mt-0.5 max-w-xs text-sm leading-snug text-white/70">
                Making water use visible for the pilot.
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Right: sign-in ── */}
      <section className="relative flex w-full flex-col items-center justify-center px-6 py-14 lg:w-[48%]">
        {/* Gentle atmosphere on the form side so it doesn't feel like a flat blank */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_500px_at_80%_-10%,rgba(8,145,178,0.10),transparent_55%)]" />

        <PageEnter>
          <div className="relative w-full max-w-[360px]">
            {/* Brand is the hero signal on this panel */}
            <div className="mb-10 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand text-white shadow-sm">
                <Droplets className="h-5 w-5" strokeWidth={2.5} />
              </div>
              <div>
                <p className="brand text-[28px] font-bold leading-none tracking-tight text-ink">
                  TapSense
                </p>
                <p className="mt-1 text-xs text-muted">Pilot Water Monitoring</p>
              </div>
            </div>

            <h1 className="text-xl font-semibold tracking-tight text-ink">
              Welcome back
            </h1>
            <p className="mt-1.5 text-sm text-ink-secondary">
              Sign in to the monitoring dashboard
            </p>

            <form className="mt-8 space-y-5" onSubmit={onSubmit}>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@college.edu"
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                />
              </div>
              <Button type="submit" className="mt-1 w-full min-h-12" disabled={loading}>
                {loading ? "Signing in…" : "Sign in"}
              </Button>
            </form>

            <p className="mt-10 text-center text-xs text-muted">
              Pilot College · Water Conservation Research
            </p>
          </div>
        </PageEnter>
      </section>
    </main>
  );
}
