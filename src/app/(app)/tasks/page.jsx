import { CalendarDays, MessageSquare, Paperclip } from "lucide-react";
import { db } from "@/server/store";
import { leanAll, userMap } from "@/server/api-utils";
import { getSession } from "@/server/session";
import { NoAccess } from "@/components/no-access";
import { PageHeader, StatusBadge, PriorityBadge } from "@/components/shared";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { TaskActions } from "@/components/actions";
import { TODAY } from "@/lib/data";
import { cn, fmtDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const sections = [
  { key: "blocked", title: "Blocked — needs unblocking", tone: "text-rose-600" },
  { key: "in-progress", title: "In progress", tone: "text-sky-600" },
  { key: "todo", title: "To do", tone: "text-zinc-600" },
  { key: "done", title: "Done", tone: "text-emerald-600" },
];

export default async function TasksPage() {
  const session = await getSession();
  if (!session.can("tasks")) return <NoAccess role={session.role} feature="tasks" />;

  const models = await db();
  const [tasks, pages] = await Promise.all([leanAll(await models.Task.find({})), leanAll(await models.Page.find({}))]);
  const users = await userMap(models, tasks.map((t) => t.assignee));
  const pageById = Object.fromEntries(pages.map((p) => [p._id, p]));

  return (
    <div>
      <PageHeader title="Tasks & collaboration" description="Delivery work across projects — statuses update live for the whole team." />

      {sections.map((s, si) => {
        const list = tasks.filter((t) => t.status === s.key);
        if (list.length === 0) return null;
        return (
          <section key={s.key} className={`rise-in rise-in-${Math.min(si + 1, 4)} mb-8`}>
            <h2 className={cn("mb-3 text-sm font-semibold uppercase tracking-wide", s.tone)}>
              {s.title} <span className="ml-1 rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">{list.length}</span>
            </h2>
            <div className="grid gap-4 xl:grid-cols-2">
              {list.map((t) => {
                const overdue = t.status !== "done" && t.deadline && t.deadline < TODAY;
                const doneSubs = (t.subtasks || []).filter((x) => x.done).length;
                return (
                  <article key={t._id} className={cn("rounded-xl border bg-card p-4 shadow-sm", t.status === "blocked" && "border-rose-200 ring-1 ring-rose-100")}>
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-medium leading-snug">{t.title}</p>
                      <PriorityBadge priority={t.priority} />
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <Avatar name={users[t.assignee]?.name || "?"} color={users[t.assignee]?.color || "bg-zinc-500"} size="sm" />
                      <span>{users[t.assignee]?.name}</span>
                      {t.pageId && <Badge variant="outline" className="text-[10px]">{pageById[t.pageId]?.name}</Badge>}
                      {t.source === "feedback" && <Badge variant="outline" className="border-rose-200 bg-rose-50 text-[10px] text-rose-700">from client feedback</Badge>}
                      <span className={cn("flex items-center gap-1", overdue && "font-semibold text-rose-600")}>
                        <CalendarDays className="h-3 w-3" /> {fmtDate(t.deadline)}
                      </span>
                      {t.attachments?.length > 0 && <span className="flex items-center gap-1"><Paperclip className="h-3 w-3" /> {t.attachments.length}</span>}
                      {t.discussion?.length > 0 && <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" /> {t.discussion.length}</span>}
                    </div>

                    {(t.subtasks || []).length > 0 && (
                      <ul className="mt-3 space-y-1 rounded-lg bg-secondary/50 p-2.5">
                        {t.subtasks.map((st) => (
                          <li key={st._id} className={cn("flex items-center gap-2 text-xs", st.done ? "text-muted-foreground line-through" : "")}>
                            <span className={cn("h-3 w-3 rounded-sm border", st.done ? "border-emerald-500 bg-emerald-500" : "border-input bg-background")} />
                            {st.label}
                          </li>
                        ))}
                        <li className="pt-1 text-[10px] text-muted-foreground">{doneSubs}/{t.subtasks.length} subtasks</li>
                      </ul>
                    )}

                    {t.discussion?.length > 0 && (
                      <div className="mt-3 space-y-2 border-l-2 border-indigo-100 pl-3">
                        {t.discussion.slice(-2).map((m, i) => (
                          <p key={i} className="text-xs leading-snug text-muted-foreground">
                            <span className="font-medium text-foreground">{users[m.by]?.name || m.by}:</span> {m.text}
                          </p>
                        ))}
                      </div>
                    )}

                    <div className="mt-3 flex items-center justify-between gap-2">
                      <StatusBadge status={t.status} />
                      <TaskActions task={t} />
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
