import { db } from "@/server/store";
import { json, leanAll, userMap } from "@/server/api-utils";

export const dynamic = "force-dynamic";

export async function GET() {
  const models = await db();
  const [projects, clients] = await Promise.all([
    leanAll(await models.Project.find({})),
    leanAll(await models.Client.find({})),
  ]);
  const clientMap = Object.fromEntries(clients.map((c) => [c._id, c]));
  const teamIds = projects.flatMap((p) => p.team);
  const users = await userMap(models, teamIds);

  return json({
    projects: projects.map((p) => ({ ...p, client: clientMap[p.clientId] || null })),
    users,
  });
}
