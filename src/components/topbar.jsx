import { Search, Database } from "lucide-react";
import { db } from "@/server/store";
import { leanAll } from "@/server/api-utils";
import { clerkEnabled } from "@/server/auth";
import { cn } from "@/lib/utils";
import { SwitchUser } from "@/components/switch-user";
import { NotificationsBell } from "@/components/notifications-bell";
import { ClerkUserButton } from "@/components/clerk-user";

/** Server-rendered topbar: identity, counts and notifications arrive in the HTML. */
export async function Topbar({ session }) {
  const models = await db();
  const notifications = leanAll(await models.Notification.find({}));
  const clerk = clerkEnabled();

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b bg-card px-6">
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          placeholder="Search projects, tasks, pages…"
          className="h-9 w-full rounded-lg border border-input bg-background/60 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="flex items-center gap-3">
        <span
          className={cn(
            "hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium sm:flex",
            session.dataSource === "mongodb"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-amber-200 bg-amber-50 text-amber-700"
          )}
          title={session.dataSource === "mongodb" ? "Connected to MongoDB" : "In-memory demo store — set MONGODB_URI to persist"}
        >
          <Database className="h-3 w-3" />
          {session.dataSource === "mongodb" ? "MongoDB" : "Demo store"}
        </span>

        <NotificationsBell initial={notifications} />

        {clerk ? (
          <ClerkUserButton />
        ) : (
          <SwitchUser users={session.switchableUsers} currentId={session.user?._id} />
        )}
      </div>
    </header>
  );
}
