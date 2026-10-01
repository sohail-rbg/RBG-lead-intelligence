import { db } from "@/server/store";
import { json, lean, readBody } from "@/server/api-utils";

export const dynamic = "force-dynamic";

/** body: { autoRenew?, remindDaysBefore? } */
export async function PATCH(request, ctx) {
  const { renewalId } = await ctx.params;
  const body = await readBody(request);
  const { Renewal } = await db();

  const service = lean(await Renewal.findById(renewalId));
  if (!service) return json({ error: "Service not found" }, 404);

  const $set = {};
  if (typeof body.autoRenew === "boolean") $set.autoRenew = body.autoRenew;
  if (Number.isFinite(Number(body.remindDaysBefore))) $set.remindDaysBefore = Number(body.remindDaysBefore);
  await Renewal.updateOne({ _id: renewalId }, { $set });

  return json({ service: lean(await Renewal.findById(renewalId)) });
}
