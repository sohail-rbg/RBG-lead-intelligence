import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle, ArrowRight, FileCheck2, FolderKanban, Timer } from "lucide-react";
import { db } from "@/server/store";
import { leanAll, userMap } from "@/server/api-utils";
import { getSession } from "@/server/session";
import { computeMetrics } from "@/server/metrics";
import { TODAY } from "@/lib/data";
import { cn, fmtDate, daysUntil, relativeDays } from "@/lib/utils";
import { StatusBadge, HealthDot } from "@/components/shared";
import { Avatar } from "@/components/ui/avatar";
import { Ring, AreaTrend, FunnelBar } from "@/components/charts";

export const dynamic = "force-dynamic";

const dayMs = 86400000;

export default async function DashboardPage() {
  const session = await getSession();
  if (!session.can("dashboard")) redirect("/portal");
  const models = await db();
  const metrics = await computeMetrics(models);

  const [projects, pages, tasks, activity] = await Promise.all([
    leanAll(await models.Project.find({})),
    leanAll(await models.Page.find({})),
    leanAll(await models.Task.find({})),
    models.Activity.find({}).then((a) => leanAll(a).sort((x, y) => (x.at < y.at ? 1 : -1))),
  ]);
  const users = await userMap(models, [...tasks.map((t) => t.assignee), ...activity.map((a) => a.user)]);

  const awaiting = pages.filter((p) => p.status === "awaiting-approval");
  const blocked = tasks.filter((t) => t.status === "blocked");
  const overdue = tasks.filter((t) => t.status !== "done" && t.deadline && t.deadline < TODAY);

  // 14-day activity trend for the hero sparkline.
  const byDay = {};
  const bump = (s) => {
    const k = String(s).slice(0, 10);
    byDay[k] = (byDay[k] || 0) + 1;
  };
  activity.forEach((a) => bump(a.at));
  pages.forEach((p) => p.history.forEach((h) => bump(h.at)));
  const trend = [];
  for (let i = 13; i >= 0; i--) {
    const day = new Date(new Date(`${TODAY}T00:00:00`).getTime() - i * dayMs).toISOString().slice(0, 10);
    trend.push(byDay[day] || 0);
  }

  const flagship = projects.find((p) => p._id === "p-aurora") || projects[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = (session.user?.name || "there").split(" ")[0];

  return (
    <div>
      {/* Hero */}
      <section className="rise-in relative mb-6 overflow-hidden rounded-2xl border bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-700 text-white shadow-md">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-32 right-40 h-64 w-64 rounded-full bg-fuchsia-400/20 blur-3xl" />
        <div className="relative grid gap-6 p-6 sm:p-7 lg:grid-cols-[1fr_auto]">
          <div>
            <p className="text-sm text-indigo-200">
              {fmtDate(TODAY)} · {session.dataSource === "mongodb" ? "MongoDB live" : "demo data"} · health {metrics.healthScore}/100
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-[28px]">{greeting}, {firstName} 👋</h1>
            <p className="mt-1.5 max-w-lg text-sm text-indigo-100">
              {awaiting.length > 0
                ? `${awaiting.length} page${awaiting.length > 1 ? "s are" : " is"} waiting on the client and ${blocked.length} task${blocked.length === 1 ? " is" : "s are"} blocked. A couple of nudges today keeps the launch on track.`
                : "No pages waiting on the client right now — keep the QC momentum going."}
            </p>

            <div className="mt-5 grid max-w-xl grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Active projects", value: projects.filter((p) => p.status !== "done").length, icon: FolderKanban },
                { label: "Awaiting client", value: awaiting.length, icon: FileCheck2 },
                { label: "Overdue tasks", value: overdue.length, icon: AlertTriangle },
                { label: "Approval speed", value: `${metrics.avgTurnaround.toFixed(1)}d`, icon: Timer },
              ].map((k, i) => (
                <div key={k.label} className={cn("rounded-xl bg-white/10 p-3 backdrop-blur-sm transition-transform hover:bg-white/15 rise-in", `rise-in-${i + 1}`)}>
                  <k.icon className="h-4 w-4 text-indigo-200" />
                  <p className="mt-1.5 text-xl font-bold leading-none">{k.value}</p>
                  <p className="mt-1 text-[11px] text-indigo-200">{k.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-6 lg:flex-col lg:items-end lg:justify-center lg:gap-4">
            {flagship && (
              <div className="flex items-center gap-4 rounded-xl bg-white/10 p-4 backdrop-blur-sm">
                <Ring value={flagship.progress} size={86} stroke={9} barClass="stroke-white" trackClass="stroke-white/20">
                  <span className="text-lg font-bold">{flagship.progress}%</span>
                </Ring>
                <div className="text-sm">
                  <p className="font-semibold">{flagship.name}</p>
                  <p className="mt-0.5 text-xs text-indigo-200">Launch {fmtDate(flagship.deliveryDate)} · {daysUntil(flagship.deliveryDate)}d left</p>
                </div>
              </div>
            )}
            <div className="hidden w-56 rounded-xl bg-white/10 p-3 backdrop-blur-sm md:block">
              <p className="mb-1 text-[11px] font-medium text-indigo-200">Activity · 14 days</p>
              <div className="h-14">
                <AreaTrend points={trend} height={56} stroke="#ffffff" id="dash-hero" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Needs attention */}
        <section className="rise-in rounded-xl border bg-card shadow-sm xl:col-span-2">
          <header className="flex items-center justify-between border-b px-5 py-4">
            <h2 className="font-semibold">Needs attention</h2>
            <Link href="/tasks" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              All tasks <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </header>
          <ul className="divide-y">
            {awaiting.map((p) => (
              <li key={p._id} className="flex items-center gap-3 px-5 py-3.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600"><FileCheck2 className="h-4 w-4" /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{p.name} v{p.version} is waiting for client approval</p>
                  <p className="text-xs text-muted-foreground">submitted {relativeDays(p.updatedAt)} · QC {p.qc?.status}</p>
                </div>
                <StatusBadge status={p.status} />
              </li>
            ))}
            {blocked.map((t) => (
              <li key={t._id} className="flex items-center gap-3 px-5 py-3.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-600"><AlertTriangle className="h-4 w-4" /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{t.title}</p>
                  <p className="text-xs text-muted-foreground">blocked · {users[t.assignee]?.name} · due {fmtDate(t.deadline)}</p>
                </div>
                <StatusBadge status={t.status} />
              </li>
            ))}
            {overdue.map((t) => (
              <li key={t._id} className="flex items-center gap-3 px-5 py-3.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-600"><Timer className="h-4 w-4" /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{t.title}</p>
                  <p className="text-xs text-muted-foreground">overdue · {users[t.assignee]?.name} · due {fmtDate(t.deadline)}</p>
                </div>
                <StatusBadge status={t.status} />
              </li>
            ))}
            {awaiting.length + blocked.length + overdue.length === 0 && (
              <li className="px-5 py-8 text-center text-sm text-muted-foreground">Nothing needs your attention 🎉</li>
            )}
          </ul>
        </section>

        {/* Projects */}
        <section className="rise-in rise-in-1 rounded-xl border bg-card shadow-sm">
          <header className="flex items-center justify-between border-b px-5 py-4">
            <h2 className="font-semibold">Projects</h2>
            <Link href="/projects" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              All <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </header>
          <ul className="divide-y">
            {projects.map((p) => (
              <li key={p._id}>
                <Link href={`/projects/${p._id}`} className="block px-5 py-4 transition-colors hover:bg-secondary/40">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium">{p.name}</p>
                    <HealthDot health={p.health} />
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{p.phase} · launch {fmtDate(p.deliveryDate)}</p>
                  <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-secondary">
                    <div className="h-full rounded-full bg-indigo-500" style={{ width: `${p.progress}%` }} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Pipeline + activity */}
      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <section className="rise-in rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="font-semibold">Approval pipeline</h2>
          <p className="mb-4 text-xs text-muted-foreground">Where the {metrics.counts.pages} Aurora pages stand</p>
          <FunnelBar segments={metrics.funnel} />
        </section>
        <section className="rise-in rise-in-1 rounded-xl border bg-card shadow-sm xl:col-span-2">
          <header className="border-b px-5 py-4"><h2 className="font-semibold">Latest activity</h2></header>
          <ul className="divide-y">
            {activity.slice(0, 7).map((a, i) => (
              <li key={i} className="flex items-start gap-3 px-5 py-3 text-sm">
                <Avatar name={users[a.user]?.name || "?"} color={users[a.user]?.color || "bg-zinc-500"} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="leading-snug"><span className="font-medium">{users[a.user]?.name}</span> {a.action}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{a.at}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
