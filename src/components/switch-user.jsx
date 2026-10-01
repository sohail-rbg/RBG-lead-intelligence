"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { ROLE_LABELS } from "@/lib/roles";

const ROLE_ORDER = ["admin", "pm", "team_leader", "developer", "client"];

/** How each role type is presented in the one-click interface switcher. */
const PERSONA_LABELS = {
  admin: "Admin",
  pm: "Project Manager",
  team_leader: "Manager",
  developer: "Employee",
  client: "Client",
};

/**
 * Demo-mode "view as" switcher: every user grouped under their role type,
 * so each role-based experience is one click away. Sets the session cookie
 * and revalidates the whole server-rendered page.
 */
export function SwitchUser({ users, currentId }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef(null);
  const current = users.find((u) => u.id === currentId) || users[0];

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const switchTo = async (id) => {
    if (id === currentId || busy) return;
    setBusy(true);
    await fetch("/api/auth/switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: id }),
    });
    setOpen(false);
    setBusy(false);
    router.refresh();
  };

  if (!current) return null;

  const groups = ROLE_ORDER.map((role) => ({ role, members: users.filter((u) => u.role === role) })).filter((g) => g.members.length > 0);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-lg border border-input bg-background px-2 py-1.5 transition-colors hover:bg-secondary/60"
        title="View as another role"
      >
        <Avatar name={current.name} color={current.color} size="sm" />
        <span className="hidden text-left sm:block">
          <span className="block text-xs font-semibold leading-tight">{current.name}</span>
          <span className="block text-[10px] leading-tight text-muted-foreground">{ROLE_LABELS[current.role]}</span>
        </span>
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-xl border bg-card shadow-lg">
          <p className="border-b px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            View content as · all role types
          </p>
          <div className="flex flex-wrap gap-1.5 border-b p-2.5">
            {ROLE_ORDER.map((role) => {
              const member = users.find((u) => u.role === role);
              if (!member) return null;
              const active = member.id === currentId;
              return (
                <button
                  key={role}
                  type="button"
                  disabled={busy}
                  onClick={() => switchTo(member.id)}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors",
                    active
                      ? "border-indigo-300 bg-indigo-600 text-white"
                      : "border-input bg-background text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
                  )}
                >
                  {PERSONA_LABELS[role]}
                </button>
              );
            })}
          </div>
          <ul className="max-h-96 overflow-y-auto p-1.5">
            {groups.map((g) => (
              <li key={g.role} className="mb-1">
                <p className="px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  {ROLE_LABELS[g.role]}
                </p>
                <ul>
                  {g.members.map((u) => (
                    <li key={u.id}>
                      <button
                        type="button"
                        onClick={() => switchTo(u.id)}
                        className={cn(
                          "flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-secondary/70",
                          u.id === currentId && "bg-secondary/50"
                        )}
                      >
                        <Avatar name={u.name} color={u.color} size="sm" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-xs font-medium">{u.name}</span>
                          <span className="block text-[10px] text-muted-foreground">{u.title}</span>
                        </span>
                        {u.id === currentId && <Check className="h-3.5 w-3.5 text-indigo-500" />}
                      </button>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
