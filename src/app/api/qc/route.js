import { db } from "@/server/store";
import { json, lean, leanAll, userMap } from "@/server/api-utils";
import { users as allUsers } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  const models = await db();
  const [suites, bugs] = await Promise.all([
    leanAll(await models.QCSuite.find({})),
    leanAll(await models.Bug.find({})),
  ]);

  const suite = suites[0] || null;
  const page = suite ? lean(await models.Page.findById(suite.pageId)) : null;
  const users = await userMap(
    models,
    [...bugs.flatMap((b) => [b.assignee, b.reportedBy]), page?.assignee, ...allUsers.map((u) => u.id)]
  );

  return json({ suite, page, bugs, users });
}
