import { cookies } from "next/headers";
import { db } from "./store";

export const ROLES = ["admin", "pm", "team_leader", "developer", "client"];

export const ROLE_LABELS = {
  admin: "Admin",
  pm: "Project Manager",
  team_leader: "Team Leader",
  developer: "Developer",
  client: "Client",
};

/** Feature permission matrix (sidebar + page gating). */
export const PERMISSIONS = {
  dashboard: ["admin", "pm", "team_leader", "developer"],
  projects: ["admin", "pm", "team_leader", "developer"],
  reports: ["admin", "pm", "team_leader"],
  tasks: ["admin", "pm", "team_leader", "developer"],
  timeline: ["admin", "pm", "team_leader", "developer", "client"],
  qc: ["admin", "pm", "team_leader", "developer"],
  approvals: ["admin", "pm", "team_leader"],
  files: ["admin", "pm", "team_leader", "developer", "client"],
  vault: ["admin", "pm", "team_leader"],
  renewals: ["admin", "pm", "team_leader", "client"],
  meetings: ["admin", "pm", "team_leader"],
  settings: ["admin", "pm"],
  portal: ["admin", "pm", "team_leader", "developer", "client"],
};

export function can(role, feature) {
  return (PERMISSIONS[feature] || []).includes(role);
}

export function permsFor(role) {
  return Object.keys(PERMISSIONS).filter((f) => can(role, f));
}

export function clerkEnabled() {
  return Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY);
}

function lean(doc) {
  if (!doc) return null;
  return typeof doc.toObject === "function" ? doc.toObject() : { ...doc };
}

/**
 * Resolve the acting user.
 * - Clerk enabled: from the Clerk session; auto-provisions the Mongo user on first login
 *   (role can be preset via Clerk publicMetadata.role, defaults to "developer").
 * - Demo mode (no Clerk keys): reads the `rbg_demo_user` cookie, defaults to the PM.
 */
export async function getCurrentUser() {
  const { User } = await db();

  if (clerkEnabled()) {
    const { auth } = await import("@clerk/nextjs/server");
    const { userId: clerkUserId, sessionClaims } = await auth();
    if (!clerkUserId) return null;

    let user = lean(await User.findOne({ clerkId: clerkUserId }));
    if (!user) {
      const email = sessionClaims?.email || sessionClaims?.email_address || "";
      const name =
        sessionClaims?.name ||
        [sessionClaims?.given_name, sessionClaims?.family_name].filter(Boolean).join(" ") ||
        email.split("@")[0] ||
        "New user";
      const role = sessionClaims?.publicMetadata?.role && ROLES.includes(sessionClaims.publicMetadata.role)
        ? sessionClaims.publicMetadata.role
        : "developer";
      const initials = name
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
      const created = await User.create({
        clerkId: clerkUserId,
        email,
        name,
        role,
        title: ROLE_LABELS[role],
        initials,
        color: "bg-indigo-600",
        clientId: null,
        active: true,
      });
      user = lean(created);
    }
    return user;
  }

  const store = await cookies();
  const demoId = store.get("rbg_demo_user")?.value || "u-priya";
  const user = lean(await User.findById(demoId));
  return user || lean(await User.findById("u-priya"));
}

export function publicUser(user) {
  if (!user) return null;
  const { clerkId, ...rest } = user;
  return rest;
}
