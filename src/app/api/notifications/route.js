import { db } from "@/server/store";
import { json, leanAll, readBody } from "@/server/api-utils";

export const dynamic = "force-dynamic";

export async function GET() {
  const { Notification } = await db();
  return json({ notifications: leanAll(await Notification.find({})) });
}

/** body: { markAllRead: true } or { id, unread } */
export async function PATCH(request) {
  const { Notification } = await db();
  const body = await readBody(request);
  if (body.markAllRead) {
    const all = leanAll(await Notification.find({}));
    for (const n of all) {
      await Notification.updateOne({ _id: n._id }, { $set: { unread: false } });
    }
  } else if (body.id) {
    await Notification.updateOne({ _id: body.id }, { $set: { unread: Boolean(body.unread) } });
  }
  return json({ notifications: leanAll(await Notification.find({})) });
}
