import { db } from "@/server/store";
import { json, lean, leanAll, userMap } from "@/server/api-utils";
import { TODAY } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  const models = await db();
  const { Project, Client, Page, Task, Bug, UploadRequest, Question, Activity, ChangeRequest } = models;

  const [projects, clients, pages, tasks, bugs, uploads, questions, activity, changeRequests] = await Promise.all([
    leanAll(await Project.find({})),
    leanAll(await Client.find({})),
    leanAll(await Page.find({})),
    leanAll(await Task.find({})),
    leanAll(await Bug.find({})),
    leanAll(await UploadRequest.find({})),
    leanAll(await Question.find({})),
    Activity.find({}).then((a) => leanAll(a).sort((x, y) => (x.at < y.at ? 1 : -1))),
    leanAll(await ChangeRequest.find({})),
  ]);

  const clientMap = Object.fromEntries(clients.map((c) => [c._id, c]));
  const ids = new Set();
  tasks.forEach((t) => ids.add(t.assignee));
  activity.forEach((a) => ids.add(a.user));
  questions.forEach((q) => ids.add(q.askedBy));
  const users = await userMap(models, [...ids]);

  const openTasks = tasks.filter((t) => t.status !== "done");
  const overdue = openTasks.filter((t) => t.deadline && t.deadline < TODAY);
  const blocked = tasks.filter((t) => t.status === "blocked");
  const qcPages = pages.filter((p) => p.status === "internal-qc");
  const openBugs = bugs.filter((b) => b.status === "open" || b.status === "fixing");
  const awaitingClient = pages.filter((p) => p.status === "awaiting-approval");
  const pendingUploads = uploads.filter((u) => u.status === "pending");
  const openQuestions = questions.filter((q) => q.status === "open");

  // Upcoming deliveries = nearest open tasks.
  const upcoming = openTasks
    .filter((t) => t.deadline)
    .sort((a, b) => (a.deadline > b.deadline ? 1 : -1))
    .slice(0, 5)
    .map((t) => ({
      id: t._id,
      title: t.title,
      due: t.deadline,
      owner: t.assignee,
      type: t.source === "feedback" ? "Revision" : "Task",
    }));

  // Delivery risks derived from live data.
  const risks = [
    ...blocked.map((t) => ({ id: `risk-${t._id}`, severity: "high", text: `${t.title} — blocked (${t.blockedReason || "dependency"})` })),
    ...overdue.map((t) => ({ id: `risk-o-${t._id}`, severity: "medium", text: `${t.title} — overdue since ${t.deadline}` })),
    ...changeRequests
      .filter((c) => c.status === "estimated")
      .map((c) => ({ id: `risk-cr-${c._id}`, severity: "low", text: `Change request pending: ${c.title} (${c.impact})` })),
  ];

  // Workload per assignee from open tasks.
  const workloadMap = {};
  for (const t of openTasks) {
    workloadMap[t.assignee] = (workloadMap[t.assignee] || 0) + 1;
  }
  const workload = Object.entries(workloadMap)
    .map(([uid, count]) => ({ user: uid, tasks: count, capacity: Math.min(100, count * 22) }))
    .sort((a, b) => b.capacity - a.capacity);

  // Average approval turnaround: approved.at minus the matching submitted event for the same version.
  const diffs = [];
  const approvalsByDay = {};
  for (const p of pages) {
    for (let i = 0; i < p.history.length; i++) {
      const h = p.history[i];
      if (h.event === "approved") {
        const day = h.at.slice(0, 10);
        approvalsByDay[day] = (approvalsByDay[day] || 0) + 1;
      }
      if (h.event !== "approved") continue;
      const submitted = [...p.history.slice(0, i)].reverse().find((x) => x.event === "submitted" && x.version === h.version);
      if (submitted) {
        const ms = new Date(h.at.replace(" ", "T")) - new Date(submitted.at.replace(" ", "T"));
        if (ms > 0) diffs.push(ms / 86400000);
      }
    }
  }
  const avgTurnaround = diffs.length ? `${(diffs.reduce((a, b) => a + b, 0) / diffs.length).toFixed(1)} days` : "—";

  // 14-day approval/submission activity trend for sparklines.
  const trend = [];
  for (let i = 13; i >= 0; i--) {
    const day = new Date(new Date(`${TODAY}T00:00:00`).getTime() - i * 86400000).toISOString().slice(0, 10);
    let count = approvalsByDay[day] || 0;
    for (const p of pages) {
      for (const h of p.history) {
        if (h.event !== "approved" && h.at.slice(0, 10) === day) count += 1;
      }
    }
    trend.push(count);
  }

  return json({
    today: TODAY,
    trend,
    stats: {
      activeProjects: projects.filter((p) => ["onboarding", "in-progress", "qc", "approval"].includes(p.status)).length,
      pagesAwaitingClient: awaitingClient.length,
      overdueTasks: overdue.length,
      avgApprovalTurnaround: avgTurnaround,
    },
    projects: projects.map((p) => ({ ...p, client: clientMap[p.clientId] || null })),
    qcPages,
    openBugs,
    blocked,
    awaitingClient,
    pendingUploads,
    openQuestions,
    upcoming,
    risks,
    workload,
    activity: activity.slice(0, 8),
    users,
  });
}
