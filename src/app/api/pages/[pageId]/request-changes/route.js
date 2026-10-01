import { db } from "@/server/store";
import { json, lean, readBody, logActivity } from "@/server/api-utils";
import { getCurrentUser } from "@/server/auth";
import { nowStamp } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * Client requests changes. Reason is required; category/section/screenshots optional.
 * The feedback automatically becomes a task assigned to the page owner.
 */
export async function POST(request, ctx) {
  const { pageId } = await ctx.params;
  const body = await readBody(request);
  const models = await db();
  const actor = await getCurrentUser();
  if (!actor) return json({ error: "Sign in to request changes" }, 401);

  const reason = (body.reason || "").trim();
  if (reason.length < 10) {
    return json({ error: "Please explain what needs to change (at least 10 characters)." }, 422);
  }

  const page = lean(await models.Page.findById(pageId));
  if (!page) return json({ error: "Page not found" }, 404);
  if (!["awaiting-approval", "approved"].includes(page.status)) {
    return json({ error: `Cannot request changes in state: ${page.status}` }, 422);
  }

  const stamp = nowStamp();
  page.status = "revision";
  page.history = [
    ...page.history,
    {
      _id: `h-${Date.now()}`,
      version: page.version,
      event: "changes-requested",
      by: actor._id,
      at: stamp,
      note: reason,
      category: body.category || undefined,
      section: (body.section || "").trim() || undefined,
      attachments: Array.isArray(body.screenshots) ? body.screenshots : [],
    },
  ];
  await models.Page.updateOne({ _id: pageId }, { $set: { status: page.status, history: page.history } });

  // Feedback → task assigned to the page owner.
  const taskId = `t-${Date.now()}`;
  const task = await models.Task.create({
    _id: taskId,
    projectId: page.projectId,
    pageId: page._id,
    title: `Revision: ${page.name} v${page.version} — ${reason.slice(0, 60)}${reason.length > 60 ? "…" : ""}`,
    source: "feedback",
    priority: "high",
    assignee: page.assignee,
    deadline: "2026-10-04",
    status: "todo",
    dependsOn: [],
    attachments: Array.isArray(body.screenshots) ? body.screenshots : [],
    notes: `Client feedback (${body.category || "General"}): ${reason}`,
    discussion: [{ by: actor._id, at: stamp, text: reason }],
    subtasks: [],
  });

  await logActivity({
    projectId: page.projectId,
    user: actor._id,
    action: `requested changes on ${page.name} v${page.version} (${body.category || "General"})`,
  });

  return json({ page, task: lean(task) }, 201);
}
