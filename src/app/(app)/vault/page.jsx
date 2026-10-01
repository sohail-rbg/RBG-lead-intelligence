import { ExternalLink, KeyRound, ShieldCheck } from "lucide-react";
import { db } from "@/server/store";
import { leanAll, userMap } from "@/server/api-utils";
import { getSession } from "@/server/session";
import { NoAccess } from "@/components/no-access";
import { PageHeader } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { VaultReveal } from "@/components/actions";
import { fmtDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function VaultPage() {
  const session = await getSession();
  if (!session.can("vault")) return <NoAccess role={session.role} feature="the credentials vault" />;

  const models = await db();
  const [credentials, logs] = await Promise.all([leanAll(await models.Credential.find({})), leanAll(await models.VaultLog.find({}))]);
  const users = await userMap(models, [...credentials.flatMap((c) => c.access), ...logs.map((l) => l.user)]);
  const me = session.user;

  return (
    <div>
      <PageHeader title="Credentials vault" description="Secrets are encrypted at rest (AES-256-GCM). Every reveal is written to the access log.">
        <Badge variant="outline" className="text-muted-foreground"><ShieldCheck className="h-3 w-3" /> encrypted</Badge>
      </PageHeader>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          {credentials.map((c, i) => {
            const allowed = c.access.includes(me?._id) || session.role === "admin";
            return (
              <section key={c._id} className={`rise-in rise-in-${Math.min(i + 1, 4)} rounded-xl border bg-card p-5 shadow-sm`}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 text-amber-300"><KeyRound className="h-4 w-4" /></span>
                    <div>
                      <p className="text-sm font-semibold">{c.service}</p>
                      <p className="text-xs text-muted-foreground">{c.type} · rotated {fmtDate(c.lastRotated)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <code className="rounded bg-secondary px-2 py-1 text-xs">{c.username}</code>
                    {allowed ? (
                      <VaultReveal credentialId={c._id} />
                    ) : (
                      <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-700">not on access list</Badge>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <a href={c.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 font-medium text-primary hover:underline">
                    <ExternalLink className="h-3 w-3" /> {c.url}
                  </a>
                  <span className="mx-1">·</span>
                  access: {c.access.map((uid) => users[uid]?.name?.split(" ")[0]).filter(Boolean).join(", ")}
                </div>
              </section>
            );
          })}
        </div>

        <section className="rise-in rise-in-2 h-fit rounded-xl border bg-card shadow-sm">
          <header className="border-b px-5 py-4"><h2 className="font-semibold">Access log</h2></header>
          <ul className="divide-y">
            {logs.map((l, i) => (
              <li key={i} className="px-5 py-3 text-sm">
                <p><span className="font-medium">{users[l.user]?.name}</span> — {l.action}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{l.at}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
