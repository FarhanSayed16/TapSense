"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { useAuth } from "@/components/providers/AppProviders";
import { useToast } from "@/components/ui/Toast";
import { PageEnter } from "@/components/shell/PageEnter";

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
    <main className="relative flex min-h-screen items-center justify-center px-4 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_480px_at_50%_-10%,rgba(14,116,144,0.22),transparent_60%)]"
      />
      <PageEnter>
        <div className="relative w-full max-w-md rounded-2xl border border-line bg-surface/95 p-8 shadow-sm">
          <p className="brand text-4xl font-semibold tracking-tight text-ink">TapSense</p>
          <p className="mt-2 text-sm text-muted">Pilot water monitoring</p>

          <form className="mt-8 space-y-4" onSubmit={onSubmit}>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </div>
      </PageEnter>
    </main>
  );
}
