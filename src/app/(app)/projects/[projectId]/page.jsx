import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  Building2,
  CalendarDays,
  CheckCircle2,
  Circle,
  ExternalLink,
  FileCheck2,
  FolderOpen,
  GitPullRequestArrow,
  History,
  KeyRound,
  ListChecks,
  Mail,
  Milestone,
  NotebookText,
  Phone,
  RefreshCcw,
  Rocket,
  Users,
} from "lucide-react";
import { db } from "@/server/store";
import { lean, leanAll, userMap } from "@/server/api-utils";
import { getSession } from "@/server/session";
import { NoAccess } from "@/components/no-access";
import { PageHeader, StatusBadge, HealthDot, PriorityBadge } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Ring, FunnelBar } from "@/components/charts";
import { TaskActions, VaultReveal, SendToClient } from "@/components/actions";
import { TODAY } from "@/lib/data";
import { cn, fmtDate, fmtDateTime, daysUntil } from "@/lib/utils";

export const dynamic = "force-dynamic";

const boardCols = [
  { key: "todo", title: "To do", tone: "text-zinc-600" },
  { key: "in-progress", title: "In progress", tone: "text-sky-600" },
  { key: "blocked", title: "Blocked", tone: "text-rose-600" },
  { key: "done", title: "Done", tone: "text-emerald-600" },
];

export default async function ProjectDetailPage({ params }) {
  const { projectId } = await params;
  const session = await getSession();
  if (!session.can("projects")) return <NoAccess role={session.role} feature="projects" />;

  const models = await db();
  const project = lean(await models.Project.findById(projectId));
  if (!project) notFound();

  const [client, pages, milestones, phases, changeRequests, tasks, files, uploads, credentials, renewals, meetings, activity] =
    await Promise.all([
      lean(await models.Client.findById(project.clientId)),
      leanAll(await models.Page.find({ projectId })),
      leanAll(await models.Milestone.find({ projectId })),
      leanAll(await models.TimelinePhase.find({ projectId })),
      leanAll(await models.ChangeRequest.find({ projectId })),
      leanAll(await models.Task.find({ projectId })),
      leanAll(await models.FileAsset.find({ projectId })),
      leanAll(await models.UploadRequest.find({ projectId })),
      leanAll(await models.Credential.find({ projectId })),
      leanAll(await models.Renewal.find({ projectId })),
      leanAll(await models.Meeting.find({ projectId })),
      models.Activity.find({ projectId }).then((a) => leanAll(a).sort((x, y) => (x.at < y.at ? 1 : -1))),
    ]);
  const users = await userMap(models, [
    ...project.team,
    ...tasks.map((t) => t.assignee),
    ...files.map((f) => f.uploadedBy),
    ...activity.map((a) => a.user),
    ...meetings.flatMap((m) => m.attendees),
  ]);

  const openTasks = tasks.filter((t) => t.status !== "done");
  const blockedTasks = tasks.filter((t) => t.status === "blocked");
  const approvedPages = pages.filter((p) => p.status === "approved").length;
  const me = session.user;

  const tabs = [
    { key: "overview", label: "Overview", icon: Building2, show: true },
    { key: "tasks", label: `Task board (${tasks.length})`, icon: ListChecks, show: session.can("tasks") },
    { key: "timeline", label: "Timeline", icon: Milestone, show: session.can("timeline") },
    { key: "pages", label: `Pages (${pages.length})`, icon: FileCheck2, show: session.can("qc") },
    { key: "files", label: `Files (${files.length})`, icon: FolderOpen, show: session.can("files") },
    { key: "vault", label: "Credentials", icon: KeyRound, show: session.can("vault") },
    { key: "activity", label: "Activity", icon: History, show: true },
  ].filter((t) => t.show);

  return (
    <div>
      <PageHeader title={project.name} description={`${client?.name} · ${project.phase}`}>
        <StatusBadge status={project.status} />
        <HealthDot health={project.health} />
      </PageHeader>

      {/* Delivery snapshot */}
      <section className="rise-in mb-6 grid gap-4 rounded-xl border bg-card p-5 shadow-sm md:grid-cols-[auto_1fr]">
        <div className="flex items-center gap-4">
          <Ring value={project.progress} size={110} stroke={11} barClass="stroke-indigo-500" trackClass="stroke-indigo-100 dark:stroke-white/10">
            <span className="text-2xl font-bold">{project.progress}%</span>
            <span className="text-[10px] text-muted-foreground">complete</span>
          </Ring>
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-x-8 gap-y-2 text-sm">
            <span className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-indigo-500" /> Launch in <strong>{daysUntil(project.deliveryDate)} days</strong> ({fmtDate(project.deliveryDate)})</span>
            <span className="flex items-center gap-2"><ListChecks className="h-4 w-4 text-violet-500" /> <strong>{openTasks.length}</strong> open · <strong>{tasks.length - openTasks.length}</strong> done</span>
            <span className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-rose-500" /> <strong>{blockedTasks.length}</strong> blocked</span>
            <span className="flex items-center gap-2"><Rocket className="h-4 w-4 text-emerald-500" /> <strong>{approvedPages}/{pages.length}</strong> pages approved</span>
          </div>
          <FunnelBar
            className="mt-4"
            segments={[
              { label: "Approved", value: pages.filter((p) => p.status === "approved").length, color: "#10b981" },
              { label: "Awaiting client", value: pages.filter((p) => p.status === "awaiting-approval").length, color: "#f59e0b" },
              { label: "Changes / revision", value: pages.filter((p) => p.status === "changes-requested" || p.status === "revision").length, color: "#f43f5e" },
              { label: "Internal QC / draft", value: pages.filter((p) => p.status === "draft" || p.status === "internal-qc").length, color: "#6366f1" },
            ]}
          />
        </div>
      </section>

      <Tabs defaultValue="overview">
        <TabsList className="h-auto flex-wrap gap-1">
          {tabs.map((t) => (
            <TabsTrigger key={t.key} value={t.key}>
              <t.icon className="h-3.5 w-3.5" /> {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ---------------- Overview ---------------- */}
        <TabsContent value="overview">
          <div className="grid gap-6 xl:grid-cols-3">
            <section className="rounded-xl border bg-card p-5 shadow-sm">
              <h2 className="flex items-center gap-2 font-semibold"><Building2 className="h-4 w-4 text-indigo-500" /> Client info</h2>
              {client && (
                <div className="mt-3">
                  <div className="flex items-center gap-3">
                    <span className={cn("flex h-11 w-11 items-center justify-center rounded-xl text-sm font-bold text-white", client.logoBg)}>{client.initials}</span>
                    <div>
                      <p className="font-semibold">{client.name}</p>
                      <p className="text-xs text-muted-foreground">client since {fmtDate(client.since)}</p>
                    </div>
                  </div>
                  <ul className="mt-4 space-y-2 text-sm">
                    <li className="flex items-center gap-2"><Users className="h-3.5 w-3.5 text-muted-foreground" /> {client.contact}</li>
                    <li className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-muted-foreground" /> {client.email}</li>
                    <li className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-muted-foreground" /> {client.phone}</li>
                  </ul>
                </div>
              )}
              <Separator className="my-4" />
              <h3 className="text-sm font-semibold">Team on this project</h3>
              <ul className="mt-2 space-y-2">
                {project.team.map((uid) => (
                  <li key={uid} className="flex items-center gap-2 text-sm">
                    <Avatar name={users[uid]?.name || "?"} color={users[uid]?.color || "bg-zinc-500"} size="sm" />
                    <span>{users[uid]?.name}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{users[uid]?.title}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-xl border bg-card p-5 shadow-sm">
              <h2 className="font-semibold">Scope</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{project.scope}</p>
              <h3 className="mt-4 text-sm font-semibold">Services we are working on</h3>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {project.services.map((s) => (
                  <Badge key={s} variant="secondary">{s}</Badge>
                ))}
              </div>
              <Separator className="my-4" />
              <h3 className="flex items-center gap-2 text-sm font-semibold"><GitPullRequestArrow className="h-4 w-4 text-violet-600" /> Change requests</h3>
              {changeRequests.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">No change requests.</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {changeRequests.map((cr) => (
                    <li key={cr._id} className="rounded-lg border border-violet-100 bg-violet-50/40 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium">{cr.title}</p>
                        <StatusBadge status={cr.status} />
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{cr.costEstimate} · {cr.timeEstimate} · {cr.impact}</p>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-xl border bg-card p-5 shadow-sm">
              <h2 className="flex items-center gap-2 font-semibold"><RefreshCcw className="h-4 w-4 text-emerald-600" /> Ongoing services & renewals</h2>
              <ul className="mt-3 space-y-2.5">
                {renewals.map((r) => {
                  const d = daysUntil(r.expires);
                  return (
                    <li key={r._id} className="flex items-center justify-between gap-2 text-sm">
                      <span className="min-w-0 truncate">{r.name}</span>
                      <span className="flex shrink-0 items-center gap-1.5">
                        {r.autoRenew && <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-[10px] text-emerald-700">auto</Badge>}
                        <Badge variant="outline" className={cn("text-[10px]", d <= 30 && !r.autoRenew && "border-rose-200 bg-rose-50 text-rose-700")}>{d}d</Badge>
                      </span>
                    </li>
                  );
                })}
              </ul>
              <Separator className="my-4" />
              <h3 className="text-sm font-semibold">Milestones</h3>
              <ul className="mt-2 space-y-2">
                {milestones.map((m) => (
                  <li key={m._id} className="flex items-center justify-between gap-2 text-sm">
                    <span className={cn("flex items-center gap-2", m.status === "done" && "text-muted-foreground line-through")}>
                      {m.status === "done" ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <Circle className="h-3.5 w-3.5 text-zinc-300" />}
                      {m.name}
                    </span>
                    <span className="text-xs text-muted-foreground">{fmtDate(m.date)}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </TabsContent>

        {/* ---------------- Task board ---------------- */}
        {session.can("tasks") && (
          <TabsContent value="tasks">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">This board stays in sync with the main Tasks page — statuses update everywhere instantly.</p>
              <Link href="/tasks" className="text-sm font-medium text-primary hover:underline">Open full task board</Link>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {boardCols.map((col) => {
                const list = tasks.filter((t) => t.status === col.key);
                return (
                  <div key={col.key} className="rounded-xl border bg-secondary/40 p-3">
                    <p className={cn("mb-2 px-1 text-xs font-semibold uppercase tracking-wide", col.tone)}>
                      {col.title} <span className="ml-1 rounded-full bg-card px-1.5 py-0.5 text-[10px] text-muted-foreground">{list.length}</span>
                    </p>
                    <div className="space-y-3">
                      {list.map((t) => {
                        const overdue = t.status !== "done" && t.deadline && t.deadline < TODAY;
                        return (
                          <article key={t._id} className={cn("rounded-lg border bg-card p-3 shadow-sm", t.status === "blocked" && "border-rose-200 ring-1 ring-rose-100")}>
                            <p className="text-[13px] font-medium leading-snug">{t.title}</p>
                            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                              <Avatar name={users[t.assignee]?.name || "?"} color={users[t.assignee]?.color || "bg-zinc-500"} size="sm" />
                              <PriorityBadge priority={t.priority} />
                              <span className={cn(overdue && "font-semibold text-rose-600")}>{fmtDate(t.deadline)}</span>
                            </div>
                            <div className="mt-2">
                              <TaskActions task={t} />
                            </div>
                          </article>
                        );
                      })}
                      {list.length === 0 && <p className="px-1 py-3 text-center text-xs text-muted-foreground">Empty</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>
        )}

        {/* ---------------- Timeline ---------------- */}
        {session.can("timeline") && (
          <TabsContent value="timeline">
            <div className="grid gap-6 xl:grid-cols-3">
              <section className="rounded-xl border bg-card p-5 shadow-sm xl:col-span-2">
                <h2 className="font-semibold">Phases — planned vs actual</h2>
                <ul className="mt-4 space-y-4">
                  {phases.map((ph) => {
                    const started = ph.actual?.[0];
                    const finished = ph.actual?.[1];
                    const late = started && finished && ph.planned?.[1] && finished > ph.planned[1];
                    return (
                      <li key={ph._id} className="rounded-lg border p-3.5">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                          <span className="flex items-center gap-2 font-medium">
                            {finished ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : started ? <Circle className="h-4 w-4 animate-pulse text-indigo-500" /> : <Circle className="h-4 w-4 text-zinc-300" />}
                            {ph.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {fmtDate(ph.planned?.[0])} → {fmtDate(ph.planned?.[1])}
                            {finished && <span className={cn("ml-2 font-semibold", late ? "text-rose-600" : "text-emerald-600")}>{late ? "late" : "on time"}</span>}
                            {started && !finished && <span className="ml-2 font-semibold text-indigo-600">in flight</span>}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
              <section className="rounded-xl border bg-card shadow-sm">
                <header className="border-b px-5 py-4"><h2 className="font-semibold">Upcoming deliveries</h2></header>
                <ul className="divide-y">
                  {tasks.filter((t) => t.status !== "done").sort((a, b) => (a.deadline < b.deadline ? -1 : 1)).slice(0, 6).map((t) => (
                    <li key={t._id} className="flex items-center gap-3 px-5 py-3">
                      <Avatar name={users[t.assignee]?.name || "?"} color={users[t.assignee]?.color || "bg-zinc-500"} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{t.title}</p>
                        <p className="text-xs text-muted-foreground">due {fmtDate(t.deadline)} ({daysUntil(t.deadline)}d)</p>
                      </div>
                      <StatusBadge status={t.status} />
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </TabsContent>
        )}

        {/* ---------------- Pages ---------------- */}
        {session.can("qc") && (
          <TabsContent value="pages">
            <section className="rounded-xl border bg-card shadow-sm">
              <header className="flex items-center justify-between border-b px-5 py-4">
                <h2 className="font-semibold">Pages · {approvedPages}/{pages.length} approved</h2>
                <Link href="/approvals" className="text-sm font-medium text-primary hover:underline">Approval workflow</Link>
              </header>
              <ul className="divide-y">
                {pages.map((pg) => (
                  <li key={pg._id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{pg.name}</p>
                      <p className="text-xs text-muted-foreground">{pg.url} · v{pg.version} · owner {users[pg.assignee]?.name} · QC {pg.qc?.status}</p>
                    </div>
                    <a href={pg.previewUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                      <ExternalLink className="h-3 w-3" /> preview
                    </a>
                    <StatusBadge status={pg.status} />
                    {(pg.status === "internal-qc" || pg.status === "draft") && pg.qc?.status === "passed" && session.can("approvals") && <SendToClient page={pg} />}
                  </li>
                ))}
              </ul>
            </section>
          </TabsContent>
        )}

        {/* ---------------- Files ---------------- */}
        {session.can("files") && (
          <TabsContent value="files">
            <div className="grid gap-6 xl:grid-cols-3">
              <section className="rounded-xl border bg-card shadow-sm xl:col-span-2">
                <header className="border-b px-5 py-4"><h2 className="font-semibold">Files & assets assigned to this project</h2></header>
                <ul className="divide-y">
                  {files.map((f) => (
                    <li key={f._id} className="flex items-center gap-3 px-5 py-3">
                      <FolderOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{f.name}</p>
                        <p className="text-xs text-muted-foreground">{f.category} · {f.size} · v{f.version} · {fmtDate(f.updated)} · by {users[f.uploadedBy]?.name || f.uploadedBy}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
              <section className="rounded-xl border bg-card shadow-sm">
                <header className="border-b px-5 py-4"><h2 className="font-semibold">Waiting from client</h2></header>
                <ul className="divide-y">
                  {uploads.map((u) => (
                    <li key={u._id} className="px-5 py-3 text-sm">
                      <p className="font-medium">{u.label}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{u.status === "pending" ? `pending · blocks ${u.blocks}` : "uploaded"}</p>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </TabsContent>
        )}

        {/* ---------------- Credentials ---------------- */}
        {session.can("vault") && (
          <TabsContent value="vault">
            <div className="grid gap-4 lg:grid-cols-2">
              {credentials.map((c) => {
                const allowed = c.access.includes(me?._id) || session.role === "admin";
                return (
                  <section key={c._id} className="rounded-xl border bg-card p-5 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 text-amber-300"><KeyRound className="h-4 w-4" /></span>
                        <div>
                          <p className="text-sm font-semibold">{c.service}</p>
                          <p className="text-xs text-muted-foreground">{c.type} · rotated {fmtDate(c.lastRotated)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="rounded bg-secondary px-2 py-1 text-xs">{c.username}</code>
                        {allowed ? <VaultReveal credentialId={c._id} /> : <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-700">no access</Badge>}
                      </div>
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">
                      access: {c.access.map((uid) => users[uid]?.name?.split(" ")[0]).filter(Boolean).join(", ")}
                    </p>
                  </section>
                );
              })}
              {credentials.length === 0 && <p className="text-sm text-muted-foreground">No credentials stored for this project.</p>}
            </div>
          </TabsContent>
        )}

        {/* ---------------- Activity ---------------- */}
        <TabsContent value="activity">
          <div className="grid gap-6 xl:grid-cols-2">
            <section className="rounded-xl border bg-card shadow-sm">
              <header className="border-b px-5 py-4"><h2 className="font-semibold">Recent activity</h2></header>
              <ul className="divide-y">
                {activity.slice(0, 10).map((a, i) => (
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
            {session.can("meetings") && (
              <section className="rounded-xl border bg-card shadow-sm">
                <header className="flex items-center gap-2 border-b px-5 py-4">
                  <NotebookText className="h-4 w-4 text-indigo-500" />
                  <h2 className="font-semibold">Meetings & decisions</h2>
                </header>
                <ul className="divide-y">
                  {meetings.map((m) => (
                    <li key={m._id} className="px-5 py-4">
                      <p className="text-sm font-medium">{m.title}</p>
                      <p className="text-xs text-muted-foreground">{fmtDate(m.date)} · {m.attendees.map((uid) => users[uid]?.name?.split(" ")[0]).join(", ")}</p>
                      <ul className="mt-2 space-y-1">
                        {(m.decisions || []).map((d, di) => (
                          <li key={di} className="rounded bg-indigo-50/60 px-2 py-1 text-xs text-indigo-900">{d}</li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
