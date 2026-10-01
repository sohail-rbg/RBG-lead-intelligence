import { db } from "@/server/store";
import { json, leanAll, userMap } from "@/server/api-utils";

export const dynamic = "force-dynamic";

export async function GET() {
  const models = await db();
  const projectId = "p-aurora";
  const [files, requests] = await Promise.all([
    leanAll(await models.FileAsset.find({ projectId })),
    leanAll(await models.UploadRequest.find({ projectId })),
  ]);
  const users = await userMap(models, files.map((f) => f.uploadedBy));
  return json({ files, requests, users });
}
