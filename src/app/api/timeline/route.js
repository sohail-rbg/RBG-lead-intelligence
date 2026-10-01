import { db } from "@/server/store";
import { json, leanAll, userMap } from "@/server/api-utils";
import { TODAY } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  const models = await db();
  const projectId = "p-aurora";
  const [phases, milestones, tasks] = await Promise.all([
    leanAll(await models.TimelinePhase.find({ projectId })),
    leanAll(await models.Milestone.find({ projectId })),
    leanAll(await models.Task.find({ projectId })),
  ]);

  const upcoming = tasks
    .filter((t) => t.status !== "done" && t.deadline)
    .sort((a, b) => (a.deadline > b.deadline ? 1 : -1))
    .slice(0, 5)
    .map((t) => ({
      id: t._id,
      title: t.title,
      due: t.deadline,
      owner: t.assignee,
      type: t.source === "feedback" ? "Revision" : "Task",
    }));

  const users = await userMap(models, upcoming.map((u) => u.owner));
  return json({ today: TODAY, phases, milestones, upcoming, users });
}
