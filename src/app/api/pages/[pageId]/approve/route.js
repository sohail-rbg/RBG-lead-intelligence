import { db } from "@/server/store";
import { json, lean, logActivity } from "@/server/api-utils";
import { getCurrentUser } from "@/server/auth";
import { nowStamp } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * Client approval. Records the page version, approver and exact timestamp.
 * A later revision requires a fresh approval; earlier approvals stay in history.
 */
export async function POST(request, ctx) {
  const { pageId } = await ctx.params;
  const models = await db();
  const actor = await getCurrentUser();
  if (!actor) return json({ error: "Sign in to approve pages" }, 401);

  const page = lean(await models.Page.findById(pageId));
  if (!page) return json({ error: "Page not found" }, 404);
  if (page.status !== "awaiting-approval") {
    return json({ error: `Page is not awaiting approval (current: ${page.status})` }, 422);
  }

  const record = {
    version: page.version,
    approver: actor._id,
    approverName: actor.name,
    at: nowStamp(),
  };

  page.status = "approved";
  page.history = [
    ...page.history,
    { _id: `h-${Date.now()}`, version: page.version, event: "approved", by: actor._id, at: record.at },
  ];
  await models.Page.updateOne({ _id: pageId }, { $set: { status: page.status, history: page.history } });
  await logActivity({ projectId: page.projectId, user: actor._id, action: `approved ${page.name} v${page.version}` });

  return json({ page, approval: record });
}
