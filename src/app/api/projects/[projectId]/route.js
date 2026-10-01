import { db } from "@/server/store";
import { json, lean, leanAll, userMap } from "@/server/api-utils";

export const dynamic = "force-dynamic";

export async function GET(request, ctx) {
  const { projectId } = await ctx.params;
  const models = await db();

  const project = lean(await models.Project.findById(projectId));
  if (!project) return json({ error: "Project not found" }, 404);

  const [client, pages, milestones, changeRequests, tasks, activity, users] = await Promise.all([
    lean(await models.Client.findById(project.clientId)),
    leanAll(await models.Page.find({ projectId })),
    leanAll(await models.Milestone.find({ projectId })),
    leanAll(await models.ChangeRequest.find({ projectId })),
    leanAll(await models.Task.find({ projectId })),
    models.Activity.find({ projectId }).then((a) => leanAll(a).sort((x, y) => (x.at < y.at ? 1 : -1)).slice(0, 8)),
    userMap(models, [...project.team, ...[]].concat((await models.Activity.find({ projectId })).map((a) => lean(a).user))),
  ]);

  const openTasks = tasks.filter((t) => t.status !== "done");
  const metrics = {
    approvedPages: pages.filter((p) => p.status === "approved").length,
    totalPages: pages.length,
    openTasks: openTasks.length,
    blockedTasks: tasks.filter((t) => t.status === "blocked").length,
    doneTasks: tasks.filter((t) => t.status === "done").length,
  };

  return json({ project, client, pages, milestones, changeRequests, tasks, activity, users, metrics });
}
