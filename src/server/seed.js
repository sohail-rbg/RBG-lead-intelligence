import {
  users,
  clients,
  projects,
  milestones,
  timelinePhases,
  onboardingSteps,
  onboardingQuestions,
  pages,
  tasks,
  qcSuites,
  bugs,
  files,
  clientUploadRequests,
  credentials,
  vaultAccessLog,
  renewalServices,
  meetings,
  changeRequests,
  activity,
  notifications,
} from "@/lib/data";
import { encryptSecret } from "./crypto";

// Demo users → product roles. Plus a dedicated admin.
const ROLE_MAP = {
  "u-priya": "pm",
  "u-arjun": "team_leader",
  "u-sana": "developer",
  "u-dev": "developer",
  "u-riya": "developer",
  "u-kabir": "developer",
  "u-meera": "client",
};

const TITLES = {
  admin: "Founder & Admin",
  pm: "Project Manager",
  team_leader: "Team Leader",
  developer: "Developer",
  client: "Client",
};

export function buildSeedDocs() {
  const seedUsers = [
    { _id: "u-admin", name: "Rahul Gupta", role: "admin", title: TITLES.admin, initials: "RG", color: "bg-zinc-800", email: "rahul@rbg.studio", clerkId: null, active: true },
    ...users.map((u) => ({
      _id: u.id,
      name: u.name,
      role: ROLE_MAP[u.id] || "developer",
      title: u.role,
      initials: u.initials,
      color: u.color,
      email: `${u.name.toLowerCase().replace(/[^a-z]+/g, ".")}@${ROLE_MAP[u.id] === "client" ? "auroradental.in" : "rbg.studio"}`,
      clerkId: null,
      clientId: ROLE_MAP[u.id] === "client" ? "c-aurora" : null,
      active: true,
    })),
  ];

  return {
    User: seedUsers,
    Client: clients.map((c) => ({ ...c, _id: c.id })),
    Project: projects.map((p) => ({ ...p, _id: p.id })),
    Milestone: milestones.map((m) => ({ ...m, _id: m.id, projectId: "p-aurora" })),
    TimelinePhase: timelinePhases.map((p) => ({ ...p, _id: p.id, projectId: "p-aurora" })),
    OnboardingStep: onboardingSteps.map((s) => ({
      ...s,
      _id: `ob-${s.id}`,
      key: s.id,
      projectId: "p-aurora",
      items: s.items.map((i) => ({ _id: i.id, label: i.label, done: i.done })),
    })),
    Question: onboardingQuestions.map((q) => ({ ...q, _id: q.id, projectId: "p-aurora" })),
    Page: pages.map((p) => ({
      ...p,
      _id: p.id,
      projectId: "p-aurora",
      history: p.history.map((h) => ({ ...h, _id: h.id })),
    })),
    Task: tasks.map((t) => ({
      ...t,
      _id: t.id,
      projectId: t.projectId || "p-aurora",
      subtasks: (t.subtasks || []).map((s) => ({ ...s, _id: s.id })),
    })),
    QCSuite: qcSuites.map((s) => ({
      _id: `qcs-${s.pageId}`,
      pageId: s.pageId,
      groups: s.groups.map((g) => ({ name: g.name, checks: g.checks.map((c) => ({ _id: c.id, label: c.label, status: c.status, bugId: c.bugId || null })) })),
    })),
    Bug: bugs.map((b) => ({ ...b, _id: b.id })),
    FileAsset: files.map((f) => ({ ...f, _id: f.id, projectId: "p-aurora" })),
    UploadRequest: clientUploadRequests.map((r) => ({ ...r, _id: r.id, projectId: "p-aurora" })),
    Credential: credentials.map((c) => ({
      _id: c.id,
      projectId: "p-aurora",
      service: c.service,
      type: c.type,
      url: c.url,
      username: c.username,
      passwordEncrypted: encryptSecret(c.password),
      access: c.access,
      lastRotated: c.lastRotated,
    })),
    VaultLog: vaultAccessLog.map((l, i) => ({ ...l, _id: `vl-${i}`, detail: l.detail || null })),
    Renewal: renewalServices.map((s) => ({ ...s, _id: s.id, projectId: "p-aurora" })),
    Meeting: meetings.map((m) => ({ ...m, _id: m.id, projectId: "p-aurora" })),
    ChangeRequest: changeRequests.map((c) => ({ ...c, _id: c.id, projectId: "p-aurora" })),
    Activity: activity.map((a, i) => ({ ...a, _id: `act-${i}`, projectId: "p-aurora" })),
    Notification: notifications.map((n) => ({ ...n, _id: n.id })),
  };
}

/** Insert seed docs into any collection that is empty. Returns what was seeded. */
export async function applySeed(models, { fresh = false } = {}) {
  const seeded = [];
  const docs = buildSeedDocs();
  for (const [name, items] of Object.entries(docs)) {
    const Model = models[name];
    if (!Model) continue;
    if (fresh) await Model.deleteMany({});
    const count = await Model.countDocuments({});
    if (count === 0 && items.length > 0) {
      await Model.create(items);
      seeded.push(name);
    }
  }
  return seeded;
}
