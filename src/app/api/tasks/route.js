import { db } from "@/server/store";
import { json, leanAll, userMap } from "@/server/api-utils";

export const dynamic = "force-dynamic";

export async function GET() {
  const models = await db();
  const [tasks, pages] = await Promise.all([
    leanAll(await models.Task.find({})),
    leanAll(await models.Page.find({})),
  ]);
  const pageMap = Object.fromEntries(pages.map((p) => [p._id, { id: p._id, name: p.name }]));
  const users = await userMap(models, tasks.flatMap((t) => [t.assignee, ...t.discussion.map((d) => d.by)]));
  return json({ tasks, pageMap, users });
}
