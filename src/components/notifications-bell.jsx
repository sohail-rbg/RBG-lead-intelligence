"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const typeTone = {
  approval: "bg-amber-500",
  overdue: "bg-rose-500",
  qc: "bg-sky-500",
  renewal: "bg-emerald-500",
  onboarding: "bg-violet-500",
};

/** Notifications island — initial items are server-rendered in; mutations revalidate. */
export function NotificationsBell({ initial }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const items = initial || [];

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const unread = items.filter((n) => n.unread).length;

  const markAll = async () => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });
    setOpen(false);
    router.refresh();
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-input bg-background transition-colors hover:bg-secondary/60"
      >
        <Bell className="h-4 w-4 text-muted-foreground" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border bg-card shadow-lg">
          <div className="flex items-center justify-between border-b px-3 py-2">
            <p className="text-xs font-semibold">Notifications</p>
            <button type="button" onClick={markAll} className="flex items-center gap-1 text-[11px] font-medium text-primary hover:underline">
              <CheckCheck className="h-3 w-3" /> Mark all read
            </button>
          </div>
          <ul className="max-h-96 divide-y overflow-y-auto">
            {items.length === 0 && <li className="px-3 py-6 text-center text-xs text-muted-foreground">Nothing yet.</li>}
            {items.map((n) => (
              <li key={n._id} className={cn("flex gap-2.5 px-3 py-2.5", n.unread && "bg-indigo-50/50")}>
                <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", typeTone[n.type] || "bg-zinc-400")} />
                <div className="min-w-0">
                  <p className="text-xs leading-snug">{n.text}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">{n.time}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
