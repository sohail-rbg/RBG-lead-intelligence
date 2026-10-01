import { db } from "@/server/store";
import { json, lean, readBody } from "@/server/api-utils";

export const dynamic = "force-dynamic";

/** body: { pageId, checkId, status: "pass" | "fail" | "pending" } */
export async function POST(request) {
  const { pageId, checkId, status } = await readBody(request);
  if (!["pass", "fail", "pending"].includes(status)) return json({ error: "Invalid status" }, 400);

  const models = await db();
  const suite = lean(await models.QCSuite.findOne({ pageId }));
  if (!suite) return json({ error: "No QC suite for page" }, 404);

  suite.groups = suite.groups.map((g) => ({
    ...g,
    checks: g.checks.map((c) => (c._id === checkId ? { ...c, status } : c)),
  }));
  await models.QCSuite.updateOne({ pageId }, { $set: { groups: suite.groups } });

  // Recompute page QC progress.
  const all = suite.groups.flatMap((g) => g.checks);
  const passed = all.filter((c) => c.status === "pass").length;
  const progress = Math.round((passed / all.length) * 100);
  const qcStatus = progress === 100 && all.every((c) => c.status === "pass") ? "passed" : "in-progress";
  await models.Page.updateOne(
    { _id: pageId },
    { $set: { "qc.progress": progress, "qc.status": qcStatus, ...(qcStatus === "passed" ? { "qc.passedOn": "2026-09-30" } : {}) } }
  );

  return json({ suite, page: lean(await models.Page.findById(pageId)) });
}
