import Link from "next/link";
import { ArrowRight, IndianRupee } from "lucide-react";
import { db } from "@/server/store";
import { leanAll, userMap } from "@/server/api-utils";
import { getSession } from "@/server/session";
import { NoAccess } from "@/components/no-access";
import { PageHeader, StatusBadge, HealthDot } from "@/components/shared";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { fmtDate, daysUntil } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const session = await getSession();
  if (!session.can("projects")) return <NoAccess role={session.role} feature="projects" />;

  const models = await db();
  const [projects, clients, pages] = await Promise.all([
    leanAll(await models.Project.find({})),
    leanAll(await models.Client.find({})),
    leanAll(await models.Page.find({})),
  ]);
  const clientById = Object.fromEntries(clients.map((c) => [c._id, c]));
  const users = await userMap(models, projects.flatMap((p) => p.team));

  return (
    <div>
      <PageHeader title="Projects" description="Every client engagement, its health and delivery position." />
      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {projects.map((p, i) => {
          const approved = pages.filter((pg) => pg.projectId === p._id && pg.status === "approved").length;
          const total = pages.filter((pg) => pg.projectId === p._id).length;
          return (
            <Link
              key={p._id}
              href={`/projects/${p._id}`}
              className={`rise-in rise-in-${Math.min(i + 1, 4)} group rounded-xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold group-hover:text-primary">{p.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{clientById[p.clientId]?.name}</p>
                </div>
                <HealthDot health={p.health} />
              </div>

              <div className="mt-4 flex items-end justify-between">
                <div>
                  <p className="text-2xl font-bold">{p.progress}%</p>
                  <p className="text-[11px] text-muted-foreground">{p.phase}</p>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <p className="flex items-center justify-end gap-1 font-medium text-foreground"><IndianRupee className="h-3 w-3" />{String(p.value || "").replace("₹", "")}</p>
                  <p>{daysUntil(p.deliveryDate)}d to launch</p>
                </div>
              </div>

              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary">
                <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${p.progress}%` }} />
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="flex -space-x-1.5">
                  {p.team.slice(0, 5).map((uid) => (
                    <span key={uid} className="rounded-full ring-2 ring-card">
                      <Avatar name={users[uid]?.name || "?"} color={users[uid]?.color || "bg-zinc-500"} size="sm" />
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  {total > 0 && <Badge variant="outline" className="text-[10px]">{approved}/{total} pages approved</Badge>}
                  <StatusBadge status={p.status} />
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">Launch {fmtDate(p.deliveryDate)}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
