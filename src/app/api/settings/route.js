import { db } from "@/server/store";
import { json, leanAll } from "@/server/api-utils";
import { PERMISSIONS } from "@/server/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const models = await db();
  const [users, activity] = await Promise.all([
    leanAll(await models.User.find({})),
    models.Activity.find({}).then((a) => leanAll(a).sort((x, y) => (x.at < y.at ? 1 : -1)).slice(0, 30)),
  ]);

  return json({
    users: users.map(({ clerkId, ...u }) => u),
    activity,
    permissions: PERMISSIONS,
  });
}
