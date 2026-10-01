import { AlertTriangle, BadgeCheck, IndianRupee, Lightbulb, Timer, TrendingUp } from "lucide-react";
import { db } from "@/server/store";
import { computeMetrics } from "@/server/metrics";
import { getSession } from "@/server/session";
import { NoAccess } from "@/components/no-access";
import { PageHeader } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { fmtDate } from "@/lib/utils";
import { Donut, Bars, AreaTrend, Gauge, Heatmap, Ring, CHART_PALETTE } from "@/components/charts";

export const dynamic = "force-dynamic";

const toneStyles = {
  good: "border-emerald-200 bg-emerald-50/60 text-emerald-800",
  warn: "border-amber-200 bg-amber-50/60 text-amber-800",
  danger: "border-rose-200 bg-rose-50/60 text-rose-800",
};
const toneIcon = { good: BadgeCheck, warn: AlertTriangle, danger: AlertTriangle };

function MetricTile({ label, value, sub, icon: Icon, tone = "bg-indigo-50 text-indigo-600", className }) {
  return (
    <div className={`rounded-xl border bg-card p-5 shadow-sm ${className || ""}`}>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${tone}`}>
          {Icon && <Icon className="h-4 w-4" />}
        </span>
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

export default async function ReportsPage() {
  const session = await getSession();
  if (!session.can("reports")) return <NoAccess role={session.role} feature="reports" />;

  const d = await computeMetrics(await db());
  const turnaroundSeries = [...d.turnarounds].map((t) => Number(t.days.toFixed(1)));

  return (
    <div>
      <PageHeader title="Reports & metrics" description="Live delivery intelligence computed from the project database — updated with every approval, task and QC check.">
        <Badge variant="outline" className="text-muted-foreground">Aurora Dental · computed {d.today}</Badge>
      </PageHeader>

      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rise-in rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Project health score</p>
            <Badge variant="outline" className={d.healthScore >= 75 ? "border-emerald-200 bg-emerald-50 text-emerald-700" : d.healthScore >= 50 ? "border-amber-200 bg-amber-50 text-amber-700" : "border-rose-200 bg-rose-50 text-rose-700"}>
              {d.healthScore >= 75 ? "Healthy" : d.healthScore >= 50 ? "At risk" : "Off track"}
            </Badge>
          </div>
          <div className="mt-2 flex items-center gap-4">
            <Ring value={d.healthScore} size={84} stroke={9} barClass={d.healthScore >= 75 ? "stroke-emerald-500" : d.healthScore >= 50 ? "stroke-amber-500" : "stroke-rose-500"}>
              <span className="text-xl font-bold">{d.healthScore}</span>
            </Ring>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>{d.counts.blocked} blocked task{d.counts.blocked === 1 ? "" : "s"}</li>
              <li>{d.counts.overdue} overdue</li>
              <li>{d.qcStats.fail} failing QC check{d.qcStats.fail === 1 ? "" : "s"}</li>
            </ul>
          </div>
        </div>

        <MetricTile label="Avg approval turnaround" value={`${d.avgTurnaround.toFixed(1)} days`} sub="Submitted → client decision" icon={Timer} tone="bg-amber-50 text-amber-600" className="rise-in rise-in-1" />
        <MetricTile label="QC pass rate" value={`${d.qcStats.passRate}%`} sub={`${d.qcStats.pass}/${d.qcStats.total} checks passed · ${d.qcStats.openBugs} open bugs`} icon={BadgeCheck} tone="bg-emerald-50 text-emerald-600" className="rise-in rise-in-2" />
        <MetricTile
          label="Pipeline value"
          value={`₹${(d.financials.pipelineValue / 100000).toFixed(1)}L`}
          sub={`Recurring ₹${d.financials.renewalMonthly.toLocaleString("en-IN")}/mo · at-risk ₹${d.financials.atRiskMonthly.toLocaleString("en-IN")}/mo`}
          icon={IndianRupee}
          tone="bg-violet-50 text-violet-600"
          className="rise-in rise-in-3"
        />
      </div>

      {/* Insights */}
      <section className="rise-in rise-in-2 mt-6 rounded-xl border bg-card shadow-sm">
        <header className="flex items-center gap-2 border-b px-5 py-4">
          <Lightbulb className="h-4 w-4 text-amber-500" />
          <h2 className="font-semibold">Automated insights</h2>
        </header>
        <ul className="grid gap-3 p-5 md:grid-cols-2">
          {d.insights.map((ins, i) => {
            const Icon = toneIcon[ins.tone] || Lightbulb;
            return (
              <li key={i} className={`flex items-start gap-2.5 rounded-lg border px-3.5 py-3 text-[13px] leading-snug ${toneStyles[ins.tone]}`}>
                <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                {ins.text}
              </li>
            );
          })}
        </ul>
      </section>

      {/* Charts row 1 */}
      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <section className="rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="font-semibold">Approval funnel</h2>
          <p className="mb-4 text-xs text-muted-foreground">Where the {d.counts.pages} pages stand right now</p>
          <Donut segments={d.funnel} centerLabel={d.counts.pages} centerSub="pages" />
        </section>

        <section className="rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="font-semibold">Revision rounds by page</h2>
          <p className="mb-4 text-xs text-muted-foreground">Client change requests per page — fewer is smoother</p>
          <Bars
            data={d.revisionRounds.map((r, i) => ({ label: r.page, value: r.rounds, color: CHART_PALETTE[i % CHART_PALETTE.length], hint: `${r.page}: ${r.rounds} rounds` }))}
            height={190}
          />
        </section>

        <section className="rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="font-semibold">Approval turnaround trend</h2>
          <p className="mb-2 text-xs text-muted-foreground">Days from submission to decision, per version</p>
          <div className="h-40">
            <AreaTrend points={turnaroundSeries} height={150} id="turnaround" />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {d.turnarounds.map((t, i) => (
              <Badge key={i} variant="outline" className="text-[11px]">
                {t.page} v{t.version} · {t.days.toFixed(1)}d
              </Badge>
            ))}
          </div>
        </section>
      </div>

      {/* Charts row 2 */}
      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <section className="rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="font-semibold">Team workload</h2>
          <p className="mb-4 text-xs text-muted-foreground">Open tasks per person</p>
          <Bars
            data={d.workload.map((w, i) => ({ label: (d.users[w.user]?.name || "?").split(" ")[0], value: w.count, color: CHART_PALETTE[i % CHART_PALETTE.length], hint: `${d.users[w.user]?.name}: ${w.count} open tasks` }))}
            height={190}
          />
        </section>

        <section className="rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="font-semibold">Planned vs actual</h2>
          <p className="mb-4 text-xs text-muted-foreground">Completed phases, days</p>
          <ul className="space-y-3.5">
            {d.variance.map((v) => {
              const max = Math.max(v.planned, v.actual) || 1;
              return (
                <li key={v.phase}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium">{v.phase}</span>
                    <span className={v.delta > 0 ? "font-semibold text-rose-600" : "font-semibold text-emerald-600"}>
                      {v.delta > 0 ? `+${v.delta.toFixed(0)}d late` : v.delta < 0 ? `${Math.abs(v.delta).toFixed(0)}d early` : "on time"}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="h-2 rounded-full bg-secondary">
                      <div className="h-2 rounded-full bg-zinc-400" style={{ width: `${(v.planned / max) * 100}%` }} />
                    </div>
                    <div className="h-2 rounded-full bg-secondary">
                      <div className={`h-2 rounded-full ${v.delta > 0 ? "bg-rose-400" : "bg-emerald-500"}`} style={{ width: `${(v.actual / max) * 100}%` }} />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="mt-3 flex gap-4 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="h-2 w-4 rounded-full bg-zinc-400" /> Planned</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-4 rounded-full bg-emerald-500" /> Actual</span>
          </div>
        </section>

        <section className="rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="font-semibold">Activity heatmap</h2>
          <p className="mb-4 text-xs text-muted-foreground">Approvals, submissions & updates — last 16 weeks</p>
          <Heatmap days={d.heatmapDays} weeks={16} />
          <Separator className="my-4" />
          <h3 className="text-sm font-semibold">Renewal revenue at risk</h3>
          {d.financials.atRisk.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">Nothing at risk — all services auto-renew or expire later.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {d.financials.atRisk.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="min-w-0 truncate">{r.name.split(" — ")[0]}</span>
                  <span className="shrink-0 text-xs font-medium text-rose-600">{fmtDate(r.expires)} · {r.cost}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Management summary */}
      <section className="mt-6 rounded-xl border bg-gradient-to-br from-zinc-900 to-zinc-800 p-6 text-zinc-100 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 font-semibold text-white">
              <TrendingUp className="h-4 w-4 text-emerald-400" /> Management summary
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-zinc-300">
              {d.counts.projects} active projects for {d.counts.clients} clients · {d.counts.pages} pages tracked · {d.counts.openTasks} open tasks
              ({d.counts.blocked} blocked, {d.counts.overdue} overdue) · QC pass rate {d.qcStats.passRate}% · approvals close in {d.avgTurnaround.toFixed(1)} days on average.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Gauge value={d.healthScore} size={150} label="delivery health" />
          </div>
        </div>
      </section>
    </div>
  );
}
