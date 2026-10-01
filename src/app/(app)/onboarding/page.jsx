import { CheckCircle2, Rocket } from "lucide-react";
import { db } from "@/server/store";
import { leanAll } from "@/server/api-utils";
import { getSession } from "@/server/session";
import { PageHeader } from "@/components/shared";
import { Progress } from "@/components/ui/progress";
import { OnboardingToggle } from "@/components/actions";
import { fmtDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const session = await getSession();
  const models = await db();
  const steps = leanAll(await models.OnboardingStep.find({}));
  const items = steps.flatMap((s) => s.items);
  const done = items.filter((i) => i.done).length;
  const pct = items.length ? Math.round((done / items.length) * 100) : 0;

  return (
    <div>
      <PageHeader title="Onboarding" description="Everything we need from Aurora Dental to design, build and launch the website." />

      <section className="rise-in mb-6 rounded-xl border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600"><Rocket className="h-5 w-5" /></span>
          <div className="flex-1">
            <div className="flex items-baseline justify-between">
              <p className="font-semibold">Overall onboarding</p>
              <p className="text-sm font-bold text-violet-600">{pct}%</p>
            </div>
            <Progress value={pct} className="mt-2" indicatorClassName="bg-violet-500" />
            <p className="mt-1.5 text-xs text-muted-foreground">{done} of {items.length} items complete</p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {steps.map((s, i) => {
          const sDone = s.items.filter((x) => x.done).length;
          return (
            <section key={s._id} className={`rise-in rise-in-${Math.min(i + 1, 4)} rounded-xl border bg-card shadow-sm`}>
              <header className="flex items-center justify-between border-b px-5 py-4">
                <div>
                  <h2 className="font-semibold">{s.title}</h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">{s.description}</p>
                </div>
                {s.status === "done" ? (
                  <span className="flex items-center gap-1 text-xs font-medium text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" /> {s.completedAt ? fmtDate(s.completedAt) : "done"}</span>
                ) : (
                  <span className="text-xs font-medium text-violet-600">{sDone}/{s.items.length}</span>
                )}
              </header>
              <div className="p-3">
                {s.items.map((item) => (
                  <OnboardingToggle key={item._id} stepId={s._id} item={item} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
