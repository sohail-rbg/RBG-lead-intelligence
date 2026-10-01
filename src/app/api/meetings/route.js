import { db } from "@/server/store";
import { json, leanAll, userMap } from "@/server/api-utils";

export const dynamic = "force-dynamic";

export async function GET() {
  const models = await db();
  const meetings = leanAll(await models.Meeting.find({ projectId: "p-aurora" }));
  const tasks = leanAll(await models.Task.find({}));
  const users = await userMap(models, [...meetings.flatMap((m) => [...m.attendees, ...m.actionItems.map((a) => a.owner)])]);
  return json({
    meetings,
    users,
    taskMap: Object.fromEntries(tasks.map((t) => [t._id, { id: t._id, title: t.title }])),
  });
}
