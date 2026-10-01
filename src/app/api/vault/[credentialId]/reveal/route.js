import { db } from "@/server/store";
import { json, lean, readBody } from "@/server/api-utils";
import { getCurrentUser, can } from "@/server/auth";
import { decryptSecret } from "@/server/crypto";
import { nowStamp } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * Reveal (or copy) a vault secret. Enforces:
 *  - vault-capable role,
 *  - per-credential access list (admins may bypass),
 * and writes an entry to the access log.
 */
export async function POST(request, ctx) {
  const { credentialId } = await ctx.params;
  const body = await readBody(request);
  const action = body.action === "copy" ? "Copied password" : "Revealed password";

  const actor = await getCurrentUser();
  if (!actor) return json({ error: "Sign in required" }, 401);
  if (!can(actor.role, "vault")) return json({ error: "Your role cannot access the credentials vault" }, 403);

  const models = await db();
  const credential = lean(await models.Credential.findById(credentialId));
  if (!credential) return json({ error: "Credential not found" }, 404);

  const granted = credential.access.includes(actor._id) || actor.role === "admin";
  if (!granted) {
    return json({ error: "You are not on the access list for this credential" }, 403);
  }

  await models.VaultLog.create({
    _id: `vl-${Date.now()}`,
    user: actor._id,
    action,
    service: credential.service,
    detail: null,
    at: nowStamp(),
  });

  return json({ password: decryptSecret(credential.passwordEncrypted), service: credential.service });
}
