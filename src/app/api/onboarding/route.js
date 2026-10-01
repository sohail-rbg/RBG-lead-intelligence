import { db } from "@/server/store";
import { json, leanAll } from "@/server/api-utils";

export const dynamic = "force-dynamic";

export async function GET() {
  const { OnboardingStep } = await db();
  const steps = leanAll(await OnboardingStep.find({ projectId: "p-aurora" }));
  return json({ steps });
}
