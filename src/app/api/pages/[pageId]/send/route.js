import { db } from "@/server/store";
import { json, lean, logActivity } from "@/server/api-utils";
import { getCurrentUser } from "@/server/auth";
import { nowStamp } from "@/lib/utils";

export const dynamic = "force-dynamic";

/** Internal: send a QC-passed page to the client for approval. */
export async function POST(request, ctx) {
  const { pageId } = await ctx.params;
  const models = await db();
  const actor = await getCurrentUser();

  const page = lean(await models.Page.findById(pageId));
  if (!page) return json({ error: "Page not found" }, 404);
  if (page.qc?.status !== "passed") return json({ error: "Page must pass internal QC before client approval" }, 422);

  page.status = "awaiting-approval";
  page.history = [
    ...page.history,
    { _id: `h-${Date.now()}`, version: page.version, event: "submitted", by: actor?._id || "u-priya", at: nowStamp() },
  ];
  await models.Page.updateOne({ _id: pageId }, { $set: { status: page.status, history: page.history } });
  await logActivity({ projectId: page.projectId, user: actor?._id, action: `sent ${page.name} v${page.version} for client approval` });

  return json({ page });
}
