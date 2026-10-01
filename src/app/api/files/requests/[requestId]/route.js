import { db } from "@/server/store";
import { json, lean, readBody } from "@/server/api-utils";

export const dynamic = "force-dynamic";

/** body: { status: "pending" | "uploaded" } */
export async function PATCH(request, ctx) {
  const { requestId } = await ctx.params;
  const body = await readBody(request);
  const { UploadRequest } = await db();

  const req = lean(await UploadRequest.findById(requestId));
  if (!req) return json({ error: "Upload request not found" }, 404);
  if (!["pending", "uploaded"].includes(body.status)) return json({ error: "Invalid status" }, 400);

  await UploadRequest.updateOne({ _id: requestId }, { $set: { status: body.status } });
  return json({ request: lean(await UploadRequest.findById(requestId)) });
}
