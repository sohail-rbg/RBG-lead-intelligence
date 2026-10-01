"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  ListChecks,
  Milestone,
  ShieldCheck,
  FileCheck2,
  FolderOpen,
  KeyRound,
  CalendarClock,
  NotebookText,
  Settings,
  Home,
  Rocket,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { ROLE_LABELS } from "@/lib/roles";

const internalNav = [
  {
    section: "Overview",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard, perm: "dashboard" },
      { href: "/projects", label: "Projects", icon: FolderKanban, perm: "projects" },
      { href: "/reports", label: "Reports & metrics", icon: BarChart3, perm: "reports" },
    ],
  },
  {
    section: "Delivery",
    items: [
      { href: "/tasks", label: "Tasks & collaboration", icon: ListChecks, perm: "tasks", badge: "blocked", badgeTone: "rose" },
      { href: "/timeline", label: "Timeline", icon: Milestone, perm: "timeline" },
      { href: "/qc", label: "Internal QC", icon: ShieldCheck, perm: "qc" },
      { href: "/approvals", label: "Page approvals", icon: FileCheck2, perm: "approvals", badge: "awaitingApproval", badgeTone: "amber" },
    ],
  },
  {
    section: "Service",
    items: [
      { href: "/files", label: "Files & assets", icon: FolderOpen, perm: "files" },
      { href: "/vault", label: "Credentials vault", icon: KeyRound, perm: "vault" },
      { href: "/renewals", label: "Renewals", icon: CalendarClock, perm: "renewals", badge: "urgentRenewals", badgeTone: "rose" },
      { href: "/meetings", label: "Meetings & decisions", icon: NotebookText, perm: "meetings" },
    ],
  },
  {
    section: "System",
    items: [{ href: "/settings", label: "Settings & permissions", icon: Settings, perm: "settings" }],
  },
];

const clientNav = [
  {
    section: "Your project",
    items: [
      { href: "/portal", label: "Home", icon: Home },
      { href: "/portal/approvals", label: "Pages for approval", icon: FileCheck2, badge: "awaitingApproval", badgeTone: "amber" },
      { href: "/timeline", label: "Delivery timeline", icon: Milestone },
      { href: "/onboarding", label: "Onboarding", icon: Rocket },
    ],
  },
  {
    section: "Resources",
    items: [
      { href: "/files", label: "Files & uploads", icon: FolderOpen },
      { href: "/renewals", label: "Services & renewals", icon: CalendarClock, badge: "urgentRenewals", badgeTone: "rose" },
    ],
  },
];

/** Navigation island — props are plain session data (no fetching, no skeletons). */
export function Sidebar({ user, permissions, counts }) {
  const pathname = usePathname();
  const [override, setOverride] = useState(null);
  const isClientRole = user?.role === "client";
  const routePersona = isClientRole || pathname.startsWith("/portal") ? "client" : "internal";
  const persona = isClientRole ? "client" : override && override !== routePersona ? override : routePersona;
  const nav =
    persona === "client"
      ? clientNav
      : internalNav
          .map((g) => ({ ...g, items: g.items.filter((i) => permissions.includes(i.perm)) }))
          .filter((g) => g.items.length > 0);

  return (
    <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-zinc-800 bg-zinc-950 text-zinc-300">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white shadow-lg shadow-indigo-950/40">
          R
        </span>
        <div>
          <p className="text-sm font-semibold leading-tight text-white">RBG Delivery OS</p>
          <p className="text-[11px] leading-tight text-zinc-500">Client delivery platform</p>
        </div>
      </div>

      <div className="px-4 pb-3">
        {!isClientRole && (
          <div className="mb-2 grid grid-cols-2 gap-1 rounded-lg bg-zinc-900 p-1">
            {[
              { id: "internal", label: "Internal" },
              { id: "client", label: "Client view" },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setOverride(p.id)}
                className={cn(
                  "cursor-pointer rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
                  persona === p.id ? "bg-zinc-700 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}
        <p className="px-1 text-[11px] leading-snug text-zinc-600">
          {persona === "client" ? "Previewing the client portal navigation." : "Agency workspace — role-based navigation."}
        </p>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-4">
        {nav.map((group) => (
          <div key={group.section}>
            <p className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">{group.section}</p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                const badgeCount = item.badge ? counts?.[item.badge] || 0 : 0;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors",
                        active ? "bg-indigo-500/15 text-white" : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                      )}
                    >
                      {active && <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-indigo-400" />}
                      <Icon className={cn("h-4 w-4", active ? "text-indigo-400" : "text-zinc-500")} />
                      <span className="flex-1">{item.label}</span>
                      {badgeCount > 0 && (
                        <span
                          className={cn(
                            "flex h-4.5 min-w-4.5 items-center justify-center rounded-full px-1 text-[10px] font-semibold",
                            item.badgeTone === "rose" ? "bg-rose-500/20 text-rose-300" : "bg-amber-500/20 text-amber-300"
                          )}
                        >
                          {badgeCount}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-zinc-800/80 p-4">
        {user && (
          <div className="flex items-center gap-2.5">
            <Avatar name={user.name} color={user.color} size="md" />
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium text-white">{user.name}</p>
              <p className="truncate text-[11px] text-zinc-500">{ROLE_LABELS[user.role] || user.title}</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
