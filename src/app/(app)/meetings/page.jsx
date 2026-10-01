import { CalendarDays, CheckSquare, Gavel } from "lucide-react";
import { db } from "@/server/store";
import { leanAll, userMap } from "@/server/api-utils";
import { getSession } from "@/server/session";
import { NoAccess } from "@/components/no-access";
import { PageHeader } from "@/components/shared";
import { Avatar } from "@/components/ui/avatar";
import { fmtDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MeetingsPage() {
  const session = await getSession();
  if (!session.can("meetings")) return <NoAccess role={session.role} feature="meetings" />;

  const models = await db();
  const meetings = leanAll(await models.Meeting.find({})).sort((a, b) => (a.date < b.date ? 1 : -1));
  const users = await userMap(models, [...meetings.flatMap((m) => m.attendees), ...meetings.flatMap((m) => (m.actionItems || []).map((a) => a.owner))]);

  return (
    <div>
      <PageHeader title="Meetings & decisions" description="Every review call logged with decisions and action items, so nothing is lost in chat." />
      <div className="space-y-6">
        {meetings.map((m, i) => (
          <section key={m._id} className={`rise-in rise-in-${Math.min(i + 1, 4)} rounded-xl border bg-card shadow-sm`}>
            <header className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
              <div>
                <h2 className="font-semibold">{m.title}</h2>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground"><CalendarDays className="h-3 w-3" /> {fmtDate(m.date)}</p>
              </div>
              <div className="flex -space-x-1.5">
                {m.attendees.map((uid) => (
                  <span key={uid} className="rounded-full ring-2 ring-card">
                    <Avatar name={users[uid]?.name || "?"} color={users[uid]?.color || "bg-zinc-500"} size="sm" />
                  </span>
                ))}
              </div>
            </header>
            <div className="grid gap-5 p-5 lg:grid-cols-2">
              <div>
                <p className="text-sm leading-relaxed text-muted-foreground">{m.summary}</p>
                <h3 className="mt-4 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <Gavel className="h-3.5 w-3.5" /> Decisions
                </h3>
                <ul className="mt-2 space-y-1.5">
                  {(m.decisions || []).map((d, di) => (
                    <li key={di} className="rounded-lg bg-indigo-50/60 px-3 py-2 text-sm text-indigo-900">{d}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <CheckSquare className="h-3.5 w-3.5" /> Action items
                </h3>
                <ul className="mt-2 space-y-1.5">
                  {(m.actionItems || []).map((a, ai) => (
                    <li key={ai} className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm">
                      <span>{a.label}</span>
                      <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
                        <Avatar name={users[a.owner]?.name || "?"} color={users[a.owner]?.color || "bg-zinc-500"} size="sm" />
                        {users[a.owner]?.name?.split(" ")[0]}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
