import { db, dataSource, USING_MONGO } from "@/server/store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const models = await db();
    const counts = {};
    for (const name of ["User", "Project", "Page", "Task", "Credential", "Renewal"]) {
      counts[name] = await models[name].countDocuments({});
    }
    return Response.json({ ok: true, backend: dataSource(), mongoConfigured: USING_MONGO, counts });
  } catch (err) {
    return Response.json({ ok: false, backend: dataSource(), error: String(err?.message || err) }, { status: 500 });
  }
}
