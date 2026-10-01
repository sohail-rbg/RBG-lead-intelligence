import { getCurrentUser, publicUser, permsFor, clerkEnabled, ROLE_LABELS, can } from "./auth";
import { db, dataSource } from "./store";
import { leanAll } from "./api-utils";
import { TODAY } from "@/lib/data";
import { daysUntil } from "@/lib/utils";

/**
 * Server-side session bundle for SSR pages: acting user, permissions,
 * live nav counts and (demo mode) switchable users. No client fetch needed.
 */
export async function getSession() {
  const authMode = clerkEnabled() ? "clerk" : "demo";
  const user = await getCurrentUser();
  const models = await db();

  let switchableUsers = [];
  if (!clerkEnabled()) {
    switchableUsers = leanAll(await models.User.find({})).map((u) => ({
      id: u._id,
      name: u.name,
      role: u.role,
      title: u.title,
      initials: u.initials,
      color: u.color,
    }));
  }

  const [pages, tasks, renewals] = await Promise.all([
    leanAll(await models.Page.find({})),
    leanAll(await models.Task.find({})),
    leanAll(await models.Renewal.find({})),
  ]);

  const counts = {
    awaitingApproval: pages.filter((p) => p.status === "awaiting-approval").length,
    blocked: tasks.filter((t) => t.status === "blocked").length,
    overdue: tasks.filter((t) => t.status !== "done" && t.deadline && t.deadline < TODAY).length,
    urgentRenewals: renewals.filter((r) => daysUntil(r.expires) <= 30).length,
  };

  return {
    user: publicUser(user),
    role: user ? user.role : null,
    roleLabel: user ? ROLE_LABELS[user.role] : null,
    permissions: user ? permsFor(user.role) : [],
    can: (feature) => (user ? can(user.role, feature) : false),
    authMode,
    dataSource: dataSource(),
    switchableUsers,
    counts,
  };
}
