import { db } from "@/server/store";
import { json, lean, readBody } from "@/server/api-utils";
import { getCurrentUser } from "@/server/auth";
import { nowStamp } from "@/lib/utils";

export const dynamic = "force-dynamic";

/** body: { title, pageId, severity, assignee, steps } — file a bug (from a failed QC check). */
export async function POST(request) {
  const body = await readBody(request);
  if (!body.title || !body.pageId) return json({ error: "title and pageId are required" }, 400);

  const models = await db();
  const actor = await getCurrentUser();
  const bug = await models.Bug.create({
    _id: `b-${Date.now()}`,
    title: body.title,
    pageId: body.pageId,
    severity: body.severity || "major",
    status: "open",
    assignee: body.assignee || null,
    reportedBy: actor?._id || null,
    reportedAt: nowStamp(),
    steps: body.steps || "",
  });

  // Link the check if provided.
  if (body.checkId) {
    const suite = lean(await models.QCSuite.findOne({ pageId: body.pageId }));
    if (suite) {
      suite.groups = suite.groups.map((g) => ({
        ...g,
        checks: g.checks.map((c) => (c._id === body.checkId ? { ...c, bugId: bug._id } : c)),
      }));
      await models.QCSuite.updateOne({ pageId: body.pageId }, { $set: { groups: suite.groups } });
    }
  }

  return json({ bug: lean(bug) }, 201);
}
