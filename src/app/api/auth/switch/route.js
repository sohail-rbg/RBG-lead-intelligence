import { cookies } from "next/headers";
import { db } from "@/server/store";
import { clerkEnabled } from "@/server/auth";
import { readBody } from "@/server/api-utils";

export const dynamic = "force-dynamic";

/** Demo-mode only: switch the acting user to preview different roles. */
export async function POST(request) {
  if (clerkEnabled()) {
    return Response.json({ error: "Clerk is enabled — sign in / out to change user." }, { status: 400 });
  }
  const { userId } = await readBody(request);
  const { User } = await db();
  const user = await User.findById(userId);
  if (!user) return Response.json({ error: "Unknown user" }, { status: 404 });

  const store = await cookies();
  store.set("rbg_demo_user", userId, { path: "/", httpOnly: true, sameSite: "lax" });
  return Response.json({ ok: true, userId });
}
