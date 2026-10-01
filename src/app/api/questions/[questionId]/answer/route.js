import { db } from "@/server/store";
import { json, lean, readBody, logActivity } from "@/server/api-utils";
import { getCurrentUser } from "@/server/auth";

export const dynamic = "force-dynamic";

/** body: { answer } */
export async function POST(request, ctx) {
  const { questionId } = await ctx.params;
  const body = await readBody(request);
  const answer = (body.answer || "").trim();
  if (!answer) return json({ error: "Answer is required" }, 400);

  const models = await db();
  const actor = await getCurrentUser();

  const question = lean(await models.Question.findById(questionId));
  if (!question) return json({ error: "Question not found" }, 404);

  await models.Question.updateOne({ _id: questionId }, { $set: { status: "answered", answer } });
  await logActivity({ projectId: question.projectId, user: actor?._id, action: "answered a project question" });

  return json({ question: lean(await models.Question.findById(questionId)) });
}
