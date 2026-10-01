import { db } from "@/server/store";
import { json, leanAll, userMap } from "@/server/api-utils";
import { getCurrentUser, can } from "@/server/auth";

export const dynamic = "force-dynamic";

/** Masked credentials + access log. Internal roles only. */
export async function GET() {
  const actor = await getCurrentUser();
  if (!actor) return json({ error: "Sign in required" }, 401);
  if (!can(actor.role, "vault")) return json({ error: "Your role cannot access the credentials vault" }, 403);

  const models = await db();
  const [credentials, logs] = await Promise.all([
    leanAll(await models.Credential.find({ projectId: "p-aurora" })),
    models.VaultLog.find({}).then((l) => leanAll(l).sort((a, b) => (a.at < b.at ? 1 : -1))),
  ]);
  const users = await userMap(models, [...credentials.flatMap((c) => c.access), ...logs.map((l) => l.user)]);

  return json({
    credentials: credentials.map(({ passwordEncrypted, ...rest }) => ({ ...rest, hasPassword: Boolean(passwordEncrypted) })),
    logs,
    users,
  });
}
