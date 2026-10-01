import { db } from "./store";
import { nowStamp } from "@/lib/utils";

export function json(data, status = 200) {
  return Response.json(data, { status });
}

export function lean(doc) {
  if (!doc) return null;
  return typeof doc.toObject === "function" ? doc.toObject() : { ...doc };
}

export function leanAll(docs) {
  return docs.map(lean);
}

/** Build an id → public user map for embedding into responses. */
export async function userMap(models, ids = []) {
  const { User } = models;
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return {};
  const found = leanAll(await User.find({ _id: { $in: unique } }));
  const map = {};
  for (const u of found) {
    map[u._id] = { id: u._id, name: u.name, role: u.role, title: u.title, initials: u.initials, color: u.color };
  }
  return map;
}

export async function logActivity({ projectId = "p-aurora", user, action }) {
  const models = await db();
  await models.Activity.create({
    _id: `act-${Date.now()}-${Math.floor(Math.random() * 1e4)}`,
    projectId,
    user,
    action,
    at: nowStamp(),
  });
}

export async function readBody(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}
