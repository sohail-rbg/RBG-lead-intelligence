import { db } from "@/server/store";
import { json, lean, readBody } from "@/server/api-utils";

export const dynamic = "force-dynamic";

/** body: { status?, assignee? } */
export async function PATCH(request, ctx) {
  const { bugId } = await ctx.params;
  const body = await readBody(request);
  const models = await db();

  const bug = lean(await models.Bug.findById(bugId));
  if (!bug) return json({ error: "Bug not found" }, 404);

  const $set = {};
  if (body.status && ["open", "fixing", "retest", "closed"].includes(body.status)) $set.status = body.status;
  if (body.assignee) $set.assignee = body.assignee;
  await models.Bug.updateOne({ _id: bugId }, { $set });

  return json({ bug: lean(await models.Bug.findById(bugId)) });
}
