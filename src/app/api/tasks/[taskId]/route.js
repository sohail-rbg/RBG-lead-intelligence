import { db } from "@/server/store";
import { json, lean, readBody, logActivity } from "@/server/api-utils";
import { getCurrentUser } from "@/server/auth";
import { TODAY } from "@/lib/data";

export const dynamic = "force-dynamic";

/**
 * PATCH task:
 *  { done: true|false }        → mark done / reopen
 *  { subtaskId: "st-1" }       → toggle subtask
 *  { status: "in-progress" }   → set status directly
 */
export async function PATCH(request, ctx) {
  const { taskId } = await ctx.params;
  const body = await readBody(request);
  const models = await db();
  const actor = await getCurrentUser();

  const task = lean(await models.Task.findById(taskId));
  if (!task) return json({ error: "Task not found" }, 404);

  if (body.subtaskId) {
    task.subtasks = task.subtasks.map((s) => (s._id === body.subtaskId ? { ...s, done: !s.done } : s));
    await models.Task.updateOne({ _id: taskId }, { $set: { subtasks: task.subtasks } });
  } else if (typeof body.done === "boolean") {
    const status = body.done ? "done" : "todo";
    await models.Task.updateOne(
      { _id: taskId },
      { $set: { status, completedAt: body.done ? TODAY : null } }
    );
    if (body.done) await logActivity({ projectId: task.projectId, user: actor?._id, action: `completed task: ${task.title}` });
  } else if (body.status) {
    await models.Task.updateOne({ _id: taskId }, { $set: { status: body.status } });
  }

  return json({ task: lean(await models.Task.findById(taskId)) });
}
