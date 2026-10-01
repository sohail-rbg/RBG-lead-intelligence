import { db } from "@/server/store";
import { json, lean, leanAll, readBody } from "@/server/api-utils";

export const dynamic = "force-dynamic";

/** body: { stepId, itemId } — toggles one onboarding item and recomputes step status. */
export async function POST(request) {
  const { stepId, itemId } = await readBody(request);
  const { OnboardingStep } = await db();

  const step = lean(await OnboardingStep.findById(stepId));
  if (!step) return json({ error: "Step not found" }, 404);

  step.items = step.items.map((i) => (i._id === itemId ? { ...i, done: !i.done } : i));
  step.status = step.items.every((i) => i.done) ? "done" : "active";
  await OnboardingStep.updateOne({ _id: stepId }, { $set: { items: step.items, status: step.status } });

  return json({ steps: leanAll(await OnboardingStep.find({ projectId: step.projectId })) });
}
