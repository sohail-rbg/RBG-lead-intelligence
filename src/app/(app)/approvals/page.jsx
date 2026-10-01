import { ExternalLink, History } from "lucide-react";
import { db } from "@/server/store";
import { leanAll, userMap } from "@/server/api-utils";
import { getSession } from "@/server/session";
import { NoAccess } from "@/components/no-access";
import { PageHeader, StatusBadge } from "@/components/shared";
import { FunnelBar } from "@/components/charts";
import { SendToClient } from "@/components/actions";
import { cn, fmtDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

const eventTone = {
  approved: "bg-emerald-500",
  "changes-requested": "bg-rose-500",
  submitted: "bg-indigo-400",
};

export default async function ApprovalsPage() {
  const session = await getSession();
  if (!session.can("approvals")) return <NoAccess role={session.role} feature="approvals" />;

  const models = await db();
  const pages = leanAll(await models.Page.find({}));
  const allUsers = await userMap(models, [...pages.flatMap((p) => p.history.map((h) => h.by)), ...pages.map((p) => p.assignee)]);

  const counts = {
    approved: pages.filter((p) => p.status === "approved").length,
    awaiting: pages.filter((p) => p.status === "awaiting-approval").length,
    feedback: pages.filter((p) => p.status === "changes-requested" || p.status === "revision").length,
    total: pages.length,
  };

  return (
    <div>
      <PageHeader title="Page approvals" description="The client approves every page before launch. Feedback becomes assigned revision tasks automatically." />

      <section className="rise-in mb-6 rounded-xl border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold">Approval pipeline</h2>
            <p className="text-xs text-muted-foreground">Every page moves through QC → client review → approved</p>
          </div>
          <div className="flex gap-6 text-center">
            {[
              { label: "Approved", value: counts.approved, tone: "text-emerald-600" },
              { label: "Awaiting client", value: counts.awaiting, tone: "text-amber-600" },
              { label: "Changes / revision", value: counts.feedback, tone: "text-rose-600" },
              { label: "Pages total", value: counts.total, tone: "text-foreground" },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className={cn("text-[11px] font-medium", s.tone)}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
        <FunnelBar
          className="mt-4"
          segments={[
            { label: "Approved", value: counts.approved, color: "#10b981" },
            { label: "Awaiting client", value: counts.awaiting, color: "#f59e0b" },
            { label: "Changes / revision", value: counts.feedback, color: "#f43f5e" },
            { label: "Internal QC / draft", value: counts.total - counts.approved - counts.awaiting - counts.feedback, color: "#6366f1" },
          ]}
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        {pages.map((p, i) => (
          <section key={p._id} className={`rise-in rise-in-${Math.min(i % 4, 4)} rounded-xl border bg-card shadow-sm`}>
            <header className="flex flex-wrap items-center justify-between gap-2 border-b px-5 py-4">
              <div>
                <h2 className="font-semibold">{p.name} <span className="text-xs font-normal text-muted-foreground">v{p.version} · {p.url}</span></h2>
                <p className="mt-0.5 text-xs text-muted-foreground">owner {allUsers[p.assignee]?.name} · QC {p.qc?.status}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={p.status} />
                {(p.status === "internal-qc" || p.status === "draft") && p.qc?.status === "passed" && <SendToClient page={p} />}
              </div>
            </header>

            <div className="px-5 py-4">
              <a href={p.previewUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                <ExternalLink className="h-3.5 w-3.5" /> Open preview v{p.version}
              </a>

              <h3 className="mt-4 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <History className="h-3.5 w-3.5" /> Approval history
              </h3>
              <ol className="mt-2 space-y-0">
                {[...p.history].reverse().map((h, idx, arr) => (
                  <li key={h._id} className="relative flex gap-3 pb-4 last:pb-0">
                    {idx < arr.length - 1 && <span className="absolute left-[5px] top-4 h-[calc(100%-10px)] w-px bg-border" />}
                    <span className={cn("relative z-10 mt-1 h-2.5 w-2.5 shrink-0 rounded-full", eventTone[h.event] || "bg-zinc-300")} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">
                        <span className="font-medium">{allUsers[h.by]?.name || h.by}</span>{" "}
                        <span className="text-muted-foreground">{h.event.replace("-", " ")}</span>{" "}
                        <span className="text-xs text-muted-foreground">v{h.version}</span>
                      </p>
                      {h.note && <p className="mt-0.5 rounded-lg bg-rose-50 px-2.5 py-1.5 text-xs leading-snug text-rose-700">“{h.note}”</p>}
                      <p className="mt-0.5 text-[11px] text-muted-foreground">{fmtDateTime(h.at)}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
