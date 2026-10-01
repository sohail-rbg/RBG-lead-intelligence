import { getCurrentUser, publicUser, permsFor, clerkEnabled, ROLE_LABELS } from "@/server/auth";
import { db, dataSource } from "@/server/store";
import { leanAll } from "@/server/api-utils";
import { TODAY } from "@/lib/data";
import { daysUntil } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET() {
  const authMode = clerkEnabled() ? "clerk" : "demo";
  const user = await getCurrentUser();

  const store = await db();
  const { User, Page, Task, Renewal } = store;

  let switchableUsers = [];
  if (!clerkEnabled()) {
    switchableUsers = leanAll(await User.find({})).map((u) => ({
      id: u._id,
      name: u.name,
      role: u.role,
      title: u.title,
      initials: u.initials,
      color: u.color,
    }));
  }

  // Live nav badges.
  const [pages, tasks, renewals] = await Promise.all([
    leanAll(await Page.find({})),
    leanAll(await Task.find({})),
    leanAll(await Renewal.find({})),
  ]);
  const counts = {
    awaitingApproval: pages.filter((p) => p.status === "awaiting-approval").length,
    blocked: tasks.filter((t) => t.status === "blocked").length,
    overdue: tasks.filter((t) => t.status !== "done" && t.deadline && t.deadline < TODAY).length,
    urgentRenewals: renewals.filter((r) => daysUntil(r.expires) <= 30).length,
  };

  if (!user) {
    return Response.json({ user: null, authMode, dataSource: dataSource(), switchableUsers, counts }, { status: 401 });
  }

  return Response.json({
    user: publicUser(user),
    roleLabel: ROLE_LABELS[user.role],
    permissions: permsFor(user.role),
    authMode,
    dataSource: dataSource(),
    switchableUsers,
    counts,
  });
}
