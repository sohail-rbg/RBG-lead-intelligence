import { db } from "@/server/store";
import { json, leanAll, userMap } from "@/server/api-utils";

export const dynamic = "force-dynamic";

/** Client-facing approval queue + full page history. */
export async function GET() {
  const models = await db();
  const pages = leanAll(await models.Page.find({ projectId: "p-aurora" }));
  const ids = pages.flatMap((p) => [p.assignee, ...p.history.map((h) => h.by)]);
  const users = await userMap(models, ids);
  return json({ pages, users });
}
