import { Bug, ShieldCheck } from "lucide-react";
import { db } from "@/server/store";
import { leanAll, userMap } from "@/server/api-utils";
import { getSession } from "@/server/session";
import { NoAccess } from "@/components/no-access";
import { PageHeader, StatusBadge } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { QcCheckButtons } from "@/components/actions";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function QcPage() {
  const session = await getSession();
  if (!session.can("qc")) return <NoAccess role={session.role} feature="qc" />;

  const models = await db();
  const [suites, pages, bugs] = await Promise.all([
    leanAll(await models.QCSuite.find({})),
    leanAll(await models.Page.find({})),
    leanAll(await models.Bug.find({})),
  ]);
  const users = await userMap(models, bugs.flatMap((b) => [b.assignee, b.reportedBy]));
  const pageById = Object.fromEntries(pages.map((p) => [p._id, p]));

  return (
    <div>
      <PageHeader title="Internal QC" description="Every page passes these checks before it reaches the client. Toggle checks as you test — page QC progress recomputes live." />

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          {suites.map((suite) => {
            const checks = suite.groups.flatMap((g) => g.checks);
            const passed = checks.filter((c) => c.status === "pass").length;
            const page = pageById[suite.pageId];
            return (
              <section key={suite._id} className="rise-in rounded-xl border bg-card shadow-sm">
                <header className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-sky-600" />
                    <h2 className="font-semibold">{page?.name || suite.pageId}</h2>
                    <Badge variant="outline" className="text-[10px]">v{page?.version}</Badge>
                  </div>
                  <div className="flex w-40 items-center gap-2">
                    <Progress value={suite.progress ?? (checks.length ? Math.round((passed / checks.length) * 100) : 0)} className="h-1.5" />
                    <span className="shrink-0 text-xs font-semibold text-muted-foreground">{passed}/{checks.length}</span>
                  </div>
                </header>
                <div className="space-y-5 p-5">
                  {suite.groups.map((g) => (
                    <div key={g.name}>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{g.name}</p>
                      <ul className="space-y-1.5">
                        {g.checks.map((c) => (
                          <li key={c._id} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
                            <span className={cn("text-sm", c.status === "pass" ? "text-muted-foreground" : c.status === "fail" ? "font-medium text-rose-700" : "")}>
                              {c.label}
                            </span>
                            <div className="flex shrink-0 items-center gap-2">
                              {c.bugId && <Badge variant="outline" className="border-rose-200 bg-rose-50 text-[10px] text-rose-700">{c.bugId}</Badge>}
                              <QcCheckButtons pageId={suite.pageId} check={c} />
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        <section className="rise-in rise-in-1 h-fit rounded-xl border bg-card shadow-sm">
          <header className="flex items-center gap-2 border-b px-5 py-4">
            <Bug className="h-4 w-4 text-rose-500" />
            <h2 className="font-semibold">Bug tracker</h2>
          </header>
          <ul className="divide-y">
            {bugs.map((b) => (
              <li key={b._id} className="px-5 py-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium leading-snug">{b.title}</p>
                  <StatusBadge status={b.status} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {b._id} · {b.severity} · {pageById[b.pageId]?.name} · reported by {users[b.reportedBy]?.name}
                </p>
                <p className="mt-2 rounded-lg bg-secondary/60 p-2.5 text-xs leading-snug text-muted-foreground">{b.steps}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
