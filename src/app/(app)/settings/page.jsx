import { Check, ShieldCheck } from "lucide-react";
import { db } from "@/server/store";
import { leanAll } from "@/server/api-utils";
import { getSession } from "@/server/session";
import { NoAccess } from "@/components/no-access";
import { PageHeader } from "@/components/shared";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PERMISSIONS, ROLE_LABELS, ROLES } from "@/server/auth";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session.can("settings")) return <NoAccess role={session.role} feature="settings" />;

  const models = await db();
  const users = leanAll(await models.User.find({}));
  const features = Object.keys(PERMISSIONS);

  return (
    <div>
      <PageHeader title="Settings & permissions" description="Team accounts and the role → feature permission matrix." />

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="rise-in rounded-xl border bg-card shadow-sm">
          <header className="border-b px-5 py-4"><h2 className="font-semibold">Team</h2></header>
          <ul className="divide-y">
            {users.map((u) => (
              <li key={u._id} className="flex items-center gap-3 px-5 py-3">
                <Avatar name={u.name} color={u.color} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{u.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{u.title} · {u.email}</p>
                </div>
                <Badge variant="outline">{ROLE_LABELS[u.role]}</Badge>
              </li>
            ))}
          </ul>
        </section>

        <section className="rise-in rise-in-1 overflow-x-auto rounded-xl border bg-card shadow-sm xl:col-span-2">
          <header className="flex items-center gap-2 border-b px-5 py-4">
            <ShieldCheck className="h-4 w-4 text-indigo-500" />
            <h2 className="font-semibold">Permission matrix</h2>
          </header>
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Feature</th>
                {ROLES.map((r) => (
                  <th key={r} className="px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">{ROLE_LABELS[r]}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {features.map((f) => (
                <tr key={f}>
                  <td className="px-5 py-2.5 font-medium capitalize">{f}</td>
                  {ROLES.map((r) => (
                    <td key={r} className="px-3 py-2.5 text-center">
                      {PERMISSIONS[f].includes(r) ? (
                        <Check className="mx-auto h-4 w-4 text-emerald-500" />
                      ) : (
                        <span className="text-zinc-300">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
