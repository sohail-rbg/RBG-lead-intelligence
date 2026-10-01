import { db } from "@/server/store";
import { json, leanAll, userMap } from "@/server/api-utils";

export const dynamic = "force-dynamic";

export async function GET() {
  const models = await db();
  const services = leanAll(await models.Renewal.find({ projectId: "p-aurora" }));
  const users = await userMap(models, services.map((s) => s.owner));
  return json({ services, users });
}
