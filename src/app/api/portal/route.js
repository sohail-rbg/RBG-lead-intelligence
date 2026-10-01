import { db } from "@/server/store";
import { json, leanAll, userMap } from "@/server/api-utils";
import { daysUntil } from "@/lib/utils";

export const dynamic = "force-dynamic";

/** Client portal home bundle. */
export async function GET() {
  const models = await db();
  const projectId = "p-aurora";

  const [project, pages, milestones, steps, uploads, questions, renewals, activity] = await Promise.all([
    models.Project.findById(projectId),
    leanAll(await models.Page.find({ projectId })),
    leanAll(await models.Milestone.find({ projectId })),
    leanAll(await models.OnboardingStep.find({ projectId })),
    leanAll(await models.UploadRequest.find({ projectId })),
    leanAll(await models.Question.find({ projectId })),
    leanAll(await models.Renewal.find({ projectId })),
    models.Activity.find({ projectId }).then((a) => leanAll(a).sort((x, y) => (x.at < y.at ? 1 : -1)).slice(0, 6)),
  ]);

  const ids = [...questions.map((q) => q.askedBy), ...activity.map((a) => a.user)];
  const users = await userMap(models, ids);

  const items = steps.flatMap((s) => s.items);
  return json({
    project: project ? (typeof project.toObject === "function" ? project.toObject() : project) : null,
    pages,
    milestones,
    onboarding: { total: items.length, done: items.filter((i) => i.done).length },
    awaitingPages: pages.filter((p) => p.status === "awaiting-approval"),
    pendingUploads: uploads.filter((u) => u.status === "pending"),
    openQuestions: questions.filter((q) => q.status === "open"),
    urgentRenewals: renewals.filter((s) => daysUntil(s.expires) <= 45),
    activity,
    users,
  });
}
