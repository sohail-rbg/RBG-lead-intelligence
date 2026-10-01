import { CheckCircle2, ExternalLink } from "lucide-react";
import { db } from "@/server/store";
import { leanAll, userMap } from "@/server/api-utils";
import { getSession } from "@/server/session";
import { PageHeader, StatusBadge } from "@/components/shared";
import { ApprovalActions } from "@/components/actions";
import { fmtDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PortalApprovalsPage() {
  const session = await getSession();
  const models = await db();
  const pages = leanAll(await models.Page.find({})).sort((a, b) => (a.name < b.name ? -1 : 1));
  const users = await userMap(models, pages.flatMap((p) => p.history.map((h) => h.by)));

  const awaiting = pages.filter((p) => p.status === "awaiting-approval");
  const rest = pages.filter((p) => p.status !== "awaiting-approval");

  return (
    <div>
      <PageHeader
        title="Pages for your approval"
        description="Review each page on the preview link, then approve it or tell us exactly what to change. Your feedback becomes a tracked task for the team."
      />

      <div className="space-y-6">
        {awaiting.map((p, i) => (
          <section key={p._id} className={`rise-in rise-in-${Math.min(i + 1, 4)} rounded-xl border border-amber-200 bg-card shadow-sm ring-1 ring-amber-100`}>
            <header className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
              <div>
                <h2 className="font-semibold">{p.name} <span className="text-xs font-normal text-muted-foreground">v{p.version} · {p.url}</span></h2>
                <p className="mt-0.5 text-xs text-muted-foreground">Ready for your review — internal QC passed</p>
              </div>
              <a href={p.previewUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-indigo-700">
                <ExternalLink className="h-3.5 w-3.5" /> Open preview
              </a>
            </header>
            <div className="p-5">
              <ApprovalActions page={p} />
              <h3 className="mt-5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">History</h3>
              <ul className="mt-2 space-y-1.5">
                {[...p.history].reverse().slice(0, 4).map((h) => (
                  <li key={h._id} className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{users[h.by]?.name || h.by}</span> {h.event.replace("-", " ")} v{h.version} · {fmtDateTime(h.at)}
                    {h.note && <span className="block rounded bg-rose-50 px-2 py-1 text-rose-700">“{h.note}”</span>}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ))}
        {awaiting.length === 0 && (
          <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">No pages waiting for your review right now.</div>
        )}

        <section className="rounded-xl border bg-card shadow-sm">
          <header className="border-b px-5 py-4"><h2 className="font-semibold">All pages</h2></header>
          <ul className="divide-y">
            {rest.map((p) => (
              <li key={p._id} className="flex items-center gap-3 px-5 py-3">
                {p.status === "approved" && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">v{p.version} · {p.url}</p>
                </div>
                <StatusBadge status={p.status} />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
