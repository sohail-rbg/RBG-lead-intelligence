import { CheckCircle2, Circle, Package } from "lucide-react";
import { db } from "@/server/store";
import { leanAll, userMap } from "@/server/api-utils";
import { getSession } from "@/server/session";
import { PageHeader, StatusBadge } from "@/components/shared";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { TODAY } from "@/lib/data";
import { fmtDate, daysUntil } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function TimelinePage() {
  const session = await getSession();
  const models = await db();
  const [phases, milestones, tasks] = await Promise.all([
    leanAll(await models.TimelinePhase.find({})),
    leanAll(await models.Milestone.find({})),
    leanAll(await models.Task.find({})),
  ]);
  const users = await userMap(models, tasks.map((t) => t.assignee));
  const upcoming = tasks
    .filter((t) => t.status !== "done")
    .sort((a, b) => (a.deadline < b.deadline ? -1 : 1))
    .slice(0, 6);

  return (
    <div>
      <PageHeader title="Delivery timeline" description="Planned vs actual across every phase — shared with the client." />

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="rise-in rounded-xl border bg-card p-5 shadow-sm xl:col-span-2">
          <h2 className="font-semibold">Phases</h2>
          <ul className="mt-4 space-y-4">
            {phases.map((ph) => {
              const started = ph.actual?.[0];
              const finished = ph.actual?.[1];
              const late = started && finished && ph.planned?.[1] && finished > ph.planned[1];
              const active = started && !finished;
              return (
                <li key={ph._id} className="rounded-lg border p-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span className="flex items-center gap-2 font-medium">
                      {finished ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : active ? <Circle className="h-4 w-4 animate-pulse text-indigo-500" /> : <Circle className="h-4 w-4 text-zinc-300" />}
                      {ph.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      planned {fmtDate(ph.planned?.[0])} → {fmtDate(ph.planned?.[1])}
                      {finished && (
                        <span className={late ? "ml-2 font-semibold text-rose-600" : "ml-2 font-semibold text-emerald-600"}>
                          {late ? `finished ${daysUntil(ph.planned[1]) - daysUntil(finished)}d late` : "on time"}
                        </span>
                      )}
                      {active && <span className="ml-2 font-semibold text-indigo-600">in flight</span>}
                    </span>
                  </div>
                  <div className="mt-2.5 space-y-1.5">
                    <PhaseBar range={ph.planned} tone="bg-zinc-300" label="Planned" />
                    {started && <PhaseBar range={ph.actual} tone={late ? "bg-rose-400" : "bg-emerald-500"} label="Actual" />}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <div className="space-y-6">
          <section className="rise-in rise-in-1 rounded-xl border bg-card shadow-sm">
            <header className="border-b px-5 py-4"><h2 className="font-semibold">Milestones</h2></header>
            <ul className="divide-y">
              {milestones.map((m) => (
                <li key={m._id} className="flex items-center justify-between gap-2 px-5 py-3 text-sm">
                  <span className={m.status === "done" ? "text-muted-foreground line-through" : "font-medium"}>{m.name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{fmtDate(m.date)}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rise-in rise-in-2 rounded-xl border bg-card shadow-sm">
            <header className="flex items-center gap-2 border-b px-5 py-4">
              <Package className="h-4 w-4 text-indigo-500" />
              <h2 className="font-semibold">Upcoming deliveries</h2>
            </header>
            <ul className="divide-y">
              {upcoming.map((t) => (
                <li key={t._id} className="flex items-center gap-3 px-5 py-3">
                  <Avatar name={users[t.assignee]?.name || "?"} color={users[t.assignee]?.color || "bg-zinc-500"} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{t.title}</p>
                    <p className="text-xs text-muted-foreground">{users[t.assignee]?.name} · due {fmtDate(t.deadline)} ({daysUntil(t.deadline)}d)</p>
                  </div>
                  <StatusBadge status={t.status} />
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}

function PhaseBar({ range, tone, label }) {
  if (!range?.[0]) return null;
  const start = new Date("2026-08-17").getTime();
  const end = new Date("2026-10-26").getTime();
  const span = end - start;
  const s = Math.max(0, (new Date(range[0]).getTime() - start) / span);
  const e = Math.min(1, (new Date(range[1] || TODAY).getTime() - start) / span);
  return (
    <div className="relative h-2 rounded-full bg-secondary" title={label}>
      <div className={`absolute h-2 rounded-full ${tone}`} style={{ left: `${s * 100}%`, width: `${Math.max(2, (e - s) * 100)}%` }} />
    </div>
  );
}
