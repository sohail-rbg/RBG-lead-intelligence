import { CalendarClock, RefreshCcw } from "lucide-react";
import { db } from "@/server/store";
import { leanAll, userMap } from "@/server/api-utils";
import { getSession } from "@/server/session";
import { NoAccess } from "@/components/no-access";
import { PageHeader } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { cn, fmtDate, daysUntil } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function RenewalsPage() {
  const session = await getSession();
  if (!session.can("renewals")) return <NoAccess role={session.role} feature="renewals" />;

  const models = await db();
  const renewals = leanAll(await models.Renewal.find({})).sort((a, b) => (a.expires < b.expires ? -1 : 1));
  const users = await userMap(models, renewals.map((r) => r.owner));

  return (
    <div>
      <PageHeader title="Services & renewals" description="Every recurring service, its expiry and reminder window — nothing lapses silently." />

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {renewals.map((r, i) => {
          const d = daysUntil(r.expires);
          const urgent = d <= 30;
          const soon = d <= 60;
          return (
            <section
              key={r._id}
              className={cn(
                "rise-in rounded-xl border bg-card p-5 shadow-sm",
                `rise-in-${Math.min(i + 1, 4)}`,
                urgent && !r.autoRenew && "border-rose-200 ring-1 ring-rose-100",
                soon && !urgent && !r.autoRenew && "border-amber-200 ring-1 ring-amber-100"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className={cn("flex h-9 w-9 items-center justify-center rounded-lg", urgent && !r.autoRenew ? "bg-rose-50 text-rose-600" : "bg-indigo-50 text-indigo-600")}>
                    <CalendarClock className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{r.name}</p>
                    <p className="text-xs text-muted-foreground">{r.category} · {r.provider}</p>
                  </div>
                </div>
                {r.autoRenew && (
                  <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                    <RefreshCcw className="h-3 w-3" /> auto
                  </Badge>
                )}
              </div>

              <div className="mt-4 flex items-end justify-between">
                <div>
                  <p className={cn("text-2xl font-bold", urgent && !r.autoRenew && "text-rose-600")}>{d}d</p>
                  <p className="text-[11px] text-muted-foreground">until expiry</p>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <p className="font-medium text-foreground">{r.cost}</p>
                  <p>expires {fmtDate(r.expires)}</p>
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">Owner {users[r.owner]?.name} · reminder {r.remindDaysBefore}d before</p>
            </section>
          );
        })}
      </div>
    </div>
  );
}
