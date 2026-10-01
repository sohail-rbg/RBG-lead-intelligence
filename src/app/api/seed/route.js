import { db } from "@/server/store";
import { applySeed } from "@/server/seed";
import { getCurrentUser } from "@/server/auth";
import { json } from "@/server/api-utils";

export const dynamic = "force-dynamic";

/**
 * POST /api/seed — reseed the database.
 * Body: { fresh: true } wipes and re-inserts demo data (admin only).
 * Without a body, only empty collections are filled.
 */
export async function POST(request) {
  const actor = await getCurrentUser();
  const body = await request.json().catch(() => ({}));
  if (body.fresh && actor?.role !== "admin") {
    return json({ error: "Only admins can force a fresh reseed" }, 403);
  }

  const models = await db();
  const seeded = await applySeed(models, { fresh: Boolean(body.fresh) });
  return json({ ok: true, seeded: seeded.length ? seeded : "nothing — collections already populated" });
}
