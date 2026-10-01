import { leanAll, userMap } from "./api-utils";
import { TODAY } from "@/lib/data";
import { daysUntil } from "@/lib/utils";

const dayMs = 86400000;
const daysBetween = (a, b) => (new Date(b.replace(" ", "T")) - new Date(a.replace(" ", "T"))) / dayMs;

/** Parse "₹9,500/mo" / "₹1,199/yr" → monthly INR. Non-INR or "Included" → null. */
function monthlyInr(cost) {
  if (!cost) return null;
  const m = cost.match(/₹([\d,]+)/);
  if (!m) return null;
  const amount = Number(m[1].replace(/,/g, ""));
  if (cost.includes("/yr")) return amount / 12;
  return amount;
}

/** Compute the full delivery-intelligence payload from the data models. */
export async function computeMetrics(models) {
  const projectId = "p-aurora";

  const [pages, tasks, bugs, suites, phases, renewals, activity, projects, clients] = await Promise.all([
    leanAll(await models.Page.find({ projectId })),
    leanAll(await models.Task.find({})),
    leanAll(await models.Bug.find({})),
    leanAll(await models.QCSuite.find({})),
    leanAll(await models.TimelinePhase.find({ projectId })),
    leanAll(await models.Renewal.find({ projectId })),
    leanAll(await models.Activity.find({})),
    leanAll(await models.Project.find({})),
    leanAll(await models.Client.find({})),
  ]);

  /* Approval funnel */
  const funnel = [
    { key: "approved", label: "Approved", color: "#10b981" },
    { key: "awaiting-approval", label: "Awaiting client", color: "#f59e0b" },
    { key: "revision", label: "Changes / revision", color: "#f43f5e" },
    { key: "internal-qc", label: "Internal QC", color: "#0ea5e9" },
    { key: "draft", label: "Draft", color: "#a1a1aa" },
  ].map((f) => ({ ...f, value: pages.filter((p) => p.status === f.key || (f.key === "revision" && p.status === "changes-requested")).length }));

  /* Revision rounds per page */
  const revisionRounds = pages
    .map((p) => ({ page: p.name, rounds: p.history.filter((h) => h.event === "changes-requested").length }))
    .filter((p) => p.rounds > 0)
    .sort((a, b) => b.rounds - a.rounds);

  /* Approval turnaround per approved version */
  const turnarounds = [];
  for (const p of pages) {
    for (let i = 0; i < p.history.length; i++) {
      const h = p.history[i];
      if (h.event !== "approved") continue;
      const submitted = [...p.history.slice(0, i)].reverse().find((x) => x.event === "submitted" && x.version === h.version);
      if (submitted) turnarounds.push({ page: p.name, version: h.version, days: Math.max(0.1, daysBetween(submitted.at, h.at)) });
    }
  }
  const avgTurnaround = turnarounds.length ? turnarounds.reduce((a, t) => a + t.days, 0) / turnarounds.length : 0;

  /* QC stats */
  const checks = suites.flatMap((s) => s.groups.flatMap((g) => g.checks));
  const qcStats = {
    total: checks.length,
    pass: checks.filter((c) => c.status === "pass").length,
    fail: checks.filter((c) => c.status === "fail").length,
    pending: checks.filter((c) => c.status === "pending").length,
    openBugs: bugs.filter((b) => b.status === "open" || b.status === "fixing").length,
  };
  qcStats.passRate = qcStats.total ? Math.round((qcStats.pass / qcStats.total) * 100) : 0;

  /* Workload */
  const openTasks = tasks.filter((t) => t.status !== "done");
  const workloadMap = {};
  for (const t of openTasks) workloadMap[t.assignee] = (workloadMap[t.assignee] || 0) + 1;

  /* Phase variance */
  const variance = phases
    .filter((p) => p.actual[0] && p.actual[1])
    .map((p) => {
      const planned = daysBetween(`${p.planned[0]} 00:00`, `${p.planned[1]} 00:00`);
      const actual = daysBetween(`${p.actual[0]} 00:00`, `${p.actual[1]} 00:00`);
      return { phase: p.name, planned, actual, delta: actual - planned };
    });

  /* Activity heatmap */
  const heat = {};
  const bump = (dateStr) => {
    const key = String(dateStr).slice(0, 10);
    heat[key] = (heat[key] || 0) + 1;
  };
  activity.forEach((a) => bump(a.at));
  pages.forEach((p) => p.history.forEach((h) => bump(h.at)));
  const heatmapDays = Object.entries(heat).map(([date, count]) => ({ date, count }));

  /* Financials */
  const pipelineValue = projects.reduce((sum, p) => {
    const m = String(p.value || "").match(/₹([\d,]+)/);
    return sum + (m ? Number(m[1].replace(/,/g, "")) : 0);
  }, 0);
  const renewalMonthly = renewals.reduce((sum, r) => sum + (monthlyInr(r.cost) || 0), 0);
  const atRisk = renewals.filter((r) => !r.autoRenew && daysUntil(r.expires) <= 60);
  const atRiskMonthly = atRisk.reduce((sum, r) => sum + (monthlyInr(r.cost) || 0), 0);

  /* Health score */
  const blocked = tasks.filter((t) => t.status === "blocked").length;
  const overdue = openTasks.filter((t) => t.deadline && t.deadline < TODAY).length;
  let score = 100;
  score -= blocked * 8;
  score -= overdue * 6;
  score -= qcStats.fail * 4;
  score -= atRisk.length * 3;
  score -= Math.max(0, ...variance.map((v) => v.delta)) * 2;
  const healthScore = Math.max(5, Math.min(100, Math.round(score)));

  /* Insights */
  const insights = [];
  if (revisionRounds[0]) {
    insights.push({ tone: "warn", text: `${revisionRounds[0].page} has the most revision rounds (${revisionRounds[0].rounds}) — consider a focused review call with the client.` });
  }
  if (blocked) insights.push({ tone: "danger", text: `${blocked} task${blocked > 1 ? "s are" : " is"} blocked — unblocking usually needs client input.` });
  if (overdue) insights.push({ tone: "danger", text: `${overdue} task${overdue > 1 ? "s" : ""} overdue — re-baseline deadlines or escalate.` });
  if (atRisk.length) insights.push({ tone: "warn", text: `${atRisk.length} service${atRisk.length > 1 ? "s" : ""} worth ₹${Math.round(atRiskMonthly).toLocaleString("en-IN")}/mo expire within 60 days without auto-renew.` });
  if (avgTurnaround > 0 && avgTurnaround <= 2) insights.push({ tone: "good", text: `Client approval turnaround is healthy at ${avgTurnaround.toFixed(1)} days on average.` });
  if (qcStats.passRate >= 80) insights.push({ tone: "good", text: `QC pass rate is strong at ${qcStats.passRate}%.` });
  const awaiting = pages.filter((p) => p.status === "awaiting-approval").length;
  if (awaiting) insights.push({ tone: "warn", text: `${awaiting} page${awaiting > 1 ? "s are" : " is"} waiting on the client — a gentle nudge keeps the launch date safe.` });

  const users = await userMap(models, [...Object.keys(workloadMap), ...tasks.map((t) => t.assignee)]);

  return {
    today: TODAY,
    healthScore,
    funnel,
    revisionRounds,
    turnarounds,
    avgTurnaround,
    qcStats,
    workload: Object.entries(workloadMap).map(([user, count]) => ({ user, count })),
    variance,
    heatmapDays,
    financials: {
      pipelineValue,
      renewalMonthly: Math.round(renewalMonthly),
      atRiskMonthly: Math.round(atRiskMonthly),
      atRisk: atRisk.map((r) => ({ id: r._id, name: r.name, expires: r.expires, cost: r.cost })),
    },
    insights,
    counts: {
      projects: projects.length,
      clients: clients.length,
      pages: pages.length,
      openTasks: openTasks.length,
      blocked,
      overdue,
    },
    users,
  };
}
