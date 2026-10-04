"use client";

import { FormEvent, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { ErrorRetry, LoadingBlock } from "@/components/ui/QueryState";
import { useAuth } from "@/components/providers/AppProviders";
import { ApiError, apiFetch } from "@/lib/api";
import { hasCap } from "@/lib/roles";
import { useApiData } from "@/lib/useApiData";

type Member = {
  email: string;
  name: string;
  role: string;
  is_active: boolean;
  building_ids?: string[] | null;
};

type MembersRes = { members: Member[] };

export default function MembersPage() {
  const { user } = useAuth();
  const allowed = hasCap(user, "members");
  const q = useApiData<MembersRes>(allowed ? "/api/v1/org/members" : null);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"facilities" | "viewer" | "org_admin">("facilities");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  if (!allowed) {
    return (
      <div className="rounded-xl border border-line bg-surface/90 p-6 text-sm text-muted">
        Members management requires org_admin.
      </div>
    );
  }

  const invite = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      await apiFetch("/api/v1/org/members", {
        method: "POST",
        body: JSON.stringify({ email, name, role, password }),
      });
      setMsg(`Invited ${email}`);
      setEmail("");
      setName("");
      setPassword("");
      void q.reload();
    } catch (err) {
      setMsg(err instanceof ApiError ? err.message : "Invite failed");
    } finally {
      setBusy(false);
    }
  };

  const setActive = async (m: Member, is_active: boolean) => {
    setBusy(true);
    setMsg(null);
    try {
      await apiFetch(`/api/v1/org/members/${encodeURIComponent(m.email)}`, {
        method: "PATCH",
        body: JSON.stringify({ is_active }),
      });
      setMsg(`${m.email} ${is_active ? "activated" : "deactivated"}`);
      void q.reload();
    } catch (err) {
      setMsg(err instanceof ApiError ? err.message : "Update failed");
    } finally {
      setBusy(false);
    }
  };

  if (q.loading && !q.data) return <LoadingBlock />;
  if (q.error && !q.data) {
    return <ErrorRetry message={q.error} onRetry={() => void q.reload()} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Members</h1>
        <p className="mt-1 text-sm text-muted">
          Invite org_admin, facilities, or viewer accounts. Demo: facilities@ / viewer@.
        </p>
      </div>

      {msg ? <p className="text-sm text-muted">{msg}</p> : null}

      <form
        onSubmit={(e) => void invite(e)}
        className="space-y-3 rounded-xl border border-line bg-surface/90 p-5"
      >
        <h2 className="text-sm font-semibold text-ink">Invite member</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="m-email">Email</Label>
            <Input
              id="m-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="m-name">Name</Label>
            <Input id="m-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="m-role">Role</Label>
            <select
              id="m-role"
              className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm"
              value={role}
              onChange={(e) => setRole(e.target.value as typeof role)}
            >
              <option value="facilities">facilities</option>
              <option value="viewer">viewer</option>
              <option value="org_admin">org_admin</option>
            </select>
          </div>
          <div>
            <Label htmlFor="m-pass">Temp password</Label>
            <Input
              id="m-pass"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
          </div>
        </div>
        <Button type="submit" disabled={busy}>
          {busy ? "Working…" : "Invite"}
        </Button>
      </form>

      <div className="space-y-2">
        {(q.data?.members ?? []).map((m) => (
          <div
            key={m.email}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface/90 px-4 py-3"
          >
            <div>
              <p className="font-medium text-ink">{m.name}</p>
              <p className="mono text-xs text-muted">{m.email}</p>
              {m.building_ids?.length ? (
                <p className="mt-1 text-xs text-muted">Buildings: {m.building_ids.join(", ")}</p>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge kind="phase">{m.role}</Badge>
              <Badge kind={m.is_active ? "status" : "neutral"}>
                {m.is_active ? "active" : "inactive"}
              </Badge>
              {m.email !== user?.email ? (
                <Button
                  variant="ghost"
                  disabled={busy}
                  onClick={() => void setActive(m, !m.is_active)}
                >
                  {m.is_active ? "Deactivate" : "Activate"}
                </Button>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
