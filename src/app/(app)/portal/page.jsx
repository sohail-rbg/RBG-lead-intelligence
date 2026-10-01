import Link from "next/link";
import { ArrowRight, CalendarClock, CheckCircle2, FileCheck2, HelpCircle, Rocket, Upload } from "lucide-react";
import { db } from "@/server/store";
import { lean, leanAll, userMap } from "@/server/api-utils";
import { getSession } from "@/server/session";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Ring } from "@/components/charts";
import { AnswerQuestion } from "@/components/actions";
import { cn, fmtDate, daysUntil } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PortalHomePage() {
  const session = await getSession();
  const models = await db();
  const projectId = "p-aurora";

  const [project, pages, milestones, steps, uploads, questions, renewals, activity] = await Promise.all([
    lean(await models.Project.findById(projectId)),
    leanAll(await models.Page.find({ projectId })),
    leanAll(await models.Milestone.find({ projectId })),
    leanAll(await models.OnboardingStep.find({ projectId })),
    leanAll(await models.UploadRequest.find({ projectId })),
    leanAll(await models.Question.find({ projectId })),
    leanAll(await models.Renewal.find({ projectId })),
    models.Activity.find({ projectId }).then((a) => leanAll(a).sort((x, y) => (x.at < y.at ? 1 : -1)).slice(0, 6)),
  ]);
  const users = await userMap(models, [...questions.map((q) => q.askedBy), ...activity.map((a) => a.user)]);

  const awaitingPages = pages.filter((p) => p.status === "awaiting-approval");
  const openQuestions = questions.filter((q) => q.status === "open");
  const pendingUploads = uploads.filter((u) => u.status === "pending");
  const urgentRenewals = renewals.filter((s) => daysUntil(s.expires) <= 45);
  const approvedCount = pages.filter((p) => p.status === "approved").length;
  const onbItems = steps.flatMap((s) => s.items);
  const onboardingLeft = onbItems.filter((i) => !i.done).length;

  const nextActions = [
    { icon: Rocket, tone: "bg-violet-50 text-violet-600", title: "Complete onboarding", detail: `${onboardingLeft} items left — Practo access and remaining content.`, href: "/onboarding", cta: "Open onboarding", show: onboardingLeft > 0 },
    { icon: Upload, tone: "bg-sky-50 text-sky-600", title: "Upload missing content", detail: pendingUploads.map((u) => u.label).join(" · ") || "All content received.", href: "/files", cta: "Upload files", show: pendingUploads.length > 0 },
    { icon: FileCheck2, tone: "bg-amber-50 text-amber-600", title: "Review pages", detail: awaitingPages.length ? awaitingPages.map((p) => `${p.name} v${p.version}`).join(" · ") + " waiting for your approval." : "No pages waiting right now.", href: "/portal/approvals", cta: "Review & approve", show: awaitingPages.length > 0, urgent: true },
    { icon: HelpCircle, tone: "bg-indigo-50 text-indigo-600", title: "Answer questions", detail: `${openQuestions.length} open question${openQuestions.length === 1 ? "" : "s"} from your project manager.`, show: openQuestions.length > 0 },
    { icon: CalendarClock, tone: "bg-emerald-50 text-emerald-600", title: "Review upcoming renewals", detail: urgentRenewals.map((s) => `${s.name.split(" — ")[0]} (${fmtDate(s.expires)})`).join(" · "), href: "/renewals", cta: "See renewals", show: urgentRenewals.length > 0 },
  ].filter((a) => a.show);

  return (
    <div>
      <section className="rise-in relative mb-6 overflow-hidden rounded-2xl border bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-600 text-white shadow-md">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-28 right-36 h-56 w-56 rounded-full bg-fuchsia-400/20 blur-3xl" />
        <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_auto]">
          <div>
            <p className="text-sm/none text-indigo-200">{project?.name}</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Welcome back 👋</h1>
            <p className="mt-1.5 max-w-xl text-sm text-indigo-100">
              Your website is {project?.progress}% complete and in the “{project?.phase}” phase. Launch is planned for{" "}
              <span className="font-semibold text-white">{fmtDate(project?.deliveryDate)}</span> — that is{" "}
              <span className="font-semibold text-white">{daysUntil(project?.deliveryDate)} days away</span>.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {[
                { icon: CheckCircle2, label: `${approvedCount}/${pages.length} pages approved` },
                { icon: FileCheck2, label: `${awaitingPages.length} waiting for your review`, urgent: awaitingPages.length > 0 },
                { icon: HelpCircle, label: `${openQuestions.length} open question${openQuestions.length === 1 ? "" : "s"}` },
                { icon: Upload, label: `${pendingUploads.length} files still requested` },
              ].map((c) => (
                <span
                  key={c.label}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium backdrop-blur-sm",
                    c.urgent ? "bg-amber-300/20 text-amber-100 ring-1 ring-amber-200/40" : "bg-white/10 text-indigo-50"
                  )}
                >
                  <c.icon className="h-3.5 w-3.5" /> {c.label}
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4 self-center lg:flex-col lg:items-end">
            <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
              <Ring value={project?.progress || 0} size={96} stroke={10} barClass="stroke-white" trackClass="stroke-white/20">
                <span className="text-xl font-bold">{project?.progress}%</span>
              </Ring>
              <p className="mt-1.5 text-center text-[11px] text-indigo-200">Overall progress</p>
            </div>
            <div className="rounded-xl bg-white/10 p-4 text-center backdrop-blur-sm">
              <p className="text-xs text-indigo-200">Launch countdown</p>
              <p className="mt-1 text-3xl font-bold">{daysUntil(project?.deliveryDate)}</p>
              <p className="text-xs text-indigo-200">days to go</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Your next actions</h2>
          {nextActions.length === 0 && (
            <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">All caught up — nothing needs your attention right now.</div>
          )}
          {nextActions.map((a) => {
            const Icon = a.icon;
            const inner = (
              <>
                <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", a.tone)}>
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{a.title}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{a.detail}</p>
                </div>
                {a.cta && (
                  <span className="flex shrink-0 items-center gap-1 text-sm font-medium text-primary">
                    {a.cta} <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </>
            );
            return a.href ? (
              <Link
                key={a.title}
                href={a.href}
                className={cn(
                  "flex items-center gap-4 rounded-xl border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md",
                  a.urgent && "border-amber-300 ring-1 ring-amber-200"
                )}
              >
                {inner}
              </Link>
            ) : (
              <div key={a.title} className="flex items-center gap-4 rounded-xl border bg-card p-4 shadow-sm">{inner}</div>
            );
          })}

          {openQuestions.length > 0 && (
            <section className="rounded-xl border bg-card p-5 shadow-sm">
              <h2 className="flex items-center gap-2 font-semibold">
                <HelpCircle className="h-4 w-4 text-indigo-600" /> Questions from your team
              </h2>
              <div className="mt-4 space-y-5">
                {openQuestions.map((q) => (
                  <div key={q._id} className="rounded-lg border bg-muted/30 p-4">
                    <p className="text-sm font-medium leading-snug">{q.question}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Asked by {users[q.askedBy]?.name} · {fmtDate(q.askedOn)}</p>
                    <div className="mt-3">
                      <AnswerQuestion question={q} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="rounded-xl border bg-card shadow-sm">
            <header className="border-b px-5 py-4"><h2 className="font-semibold">Latest updates on your project</h2></header>
            <ul className="divide-y">
              {activity.map((a) => (
                <li key={a._id} className="flex items-start gap-3 px-5 py-3.5 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
                  <div className="min-w-0 flex-1">
                    <p className="leading-snug"><span className="font-medium">{users[a.user]?.name}</span> {a.action}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{a.at}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-xl border bg-card p-5 shadow-sm">
            <h2 className="font-semibold">Delivery milestones</h2>
            <ul className="mt-3 space-y-2.5">
              {milestones.map((m) => (
                <li key={m._id} className="flex items-center justify-between gap-2 text-sm">
                  <span className={cn("flex items-center gap-2", m.status === "done" ? "text-muted-foreground" : "font-medium")}>
                    <span className={cn("h-2 w-2 rotate-45 rounded-[1px]", m.status === "done" ? "bg-emerald-500" : "bg-indigo-400")} />
                    {m.name}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">{fmtDate(m.date)}</span>
                </li>
              ))}
            </ul>
            <Separator className="my-4" />
            <Link href="/timeline" className="flex items-center justify-between text-sm font-medium text-primary hover:underline">
              View shared delivery timeline <ArrowRight className="h-4 w-4" />
            </Link>
          </section>

          <section className="rounded-xl border bg-card p-5 shadow-sm">
            <h2 className="font-semibold">Renewals coming up</h2>
            <ul className="mt-3 space-y-3">
              {urgentRenewals.map((s) => {
                const d = daysUntil(s.expires);
                return (
                  <li key={s._id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="min-w-0 truncate">{s.name.split(" — ")[0]}</span>
                    <Badge variant="outline" className={d <= 30 ? "border-rose-200 bg-rose-50 text-rose-700" : "text-muted-foreground"}>
                      {fmtDate(s.expires)}
                    </Badge>
                  </li>
                );
              })}
            </ul>
            <Link href="/renewals" className="mt-4 flex items-center justify-between text-sm font-medium text-primary hover:underline">
              All services & renewals <ArrowRight className="h-4 w-4" />
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}
