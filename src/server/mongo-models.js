import mongoose from "mongoose";

const S = mongoose.Schema;

/* ---------- Identity & access ---------- */

export const UserSchema = new S(
  {
    _id: { type: String },
    clerkId: { type: String, index: true, sparse: true },
    email: { type: String, index: true },
    name: String,
    role: { type: String, enum: ["admin", "pm", "team_leader", "developer", "client"], index: true },
    title: String,
    initials: String,
    color: String,
    clientId: { type: String, ref: "Client" }, // set for client users
    active: { type: Boolean, default: true },
  },
  { _id: false, versionKey: false }
);

export const ClientSchema = new S(
  {
    _id: String,
    name: String,
    contact: String,
    email: String,
    phone: String,
    since: String,
    logoBg: String,
    initials: String,
  },
  { _id: false, versionKey: false }
);

/* ---------- Projects & delivery ---------- */

export const ProjectSchema = new S(
  {
    _id: String,
    name: String,
    clientId: { type: String, ref: "Client" },
    status: { type: String, enum: ["onboarding", "in-progress", "qc", "approval", "launch", "maintenance", "done"] },
    phase: String,
    progress: Number,
    startDate: String,
    deliveryDate: String,
    scope: String,
    services: [String],
    team: [{ type: String, ref: "User" }],
    value: String,
    health: String,
    healthNote: String,
  },
  { _id: false, versionKey: false }
);

export const MilestoneSchema = new S(
  {
    _id: String,
    projectId: { type: String, ref: "Project", index: true },
    name: String,
    date: String,
    status: { type: String, enum: ["done", "upcoming"] },
  },
  { _id: false, versionKey: false }
);

export const TimelinePhaseSchema = new S(
  {
    _id: String,
    projectId: { type: String, ref: "Project", index: true },
    name: String,
    planned: [String],
    actual: [String],
  },
  { _id: false, versionKey: false }
);

export const OnboardingStepSchema = new S(
  {
    _id: String,
    projectId: { type: String, ref: "Project", index: true },
    key: String,
    title: String,
    description: String,
    status: { type: String, enum: ["done", "active", "todo"] },
    completedAt: String,
    items: [{ _id: String, label: String, done: Boolean }],
  },
  { _id: false, versionKey: false }
);

export const QuestionSchema = new S(
  {
    _id: String,
    projectId: { type: String, ref: "Project", index: true },
    question: String,
    askedBy: { type: String, ref: "User" },
    askedOn: String,
    status: { type: String, enum: ["open", "answered"] },
    answer: String,
  },
  { _id: false, versionKey: false }
);

/* ---------- Pages & approvals ---------- */

export const PageSchema = new S(
  {
    _id: String,
    projectId: { type: String, ref: "Project", index: true },
    name: String,
    url: String,
    status: {
      type: String,
      enum: ["draft", "internal-qc", "awaiting-approval", "approved", "changes-requested", "revision"],
      index: true,
    },
    version: Number,
    assignee: { type: String, ref: "User" },
    updatedAt: String,
    previewUrl: String,
    qc: { status: String, progress: Number, passedOn: String },
    history: [
      {
        _id: String,
        version: Number,
        event: { type: String, enum: ["submitted", "approved", "changes-requested"] },
        by: { type: String, ref: "User" },
        at: String,
        note: String,
        category: String,
        section: String,
        attachments: [String],
      },
    ],
  },
  { _id: false, versionKey: false }
);

export const TaskSchema = new S(
  {
    _id: String,
    projectId: { type: String, ref: "Project", index: true },
    pageId: { type: String, ref: "Page", default: null },
    title: String,
    source: { type: String, enum: ["task", "feedback"] },
    priority: { type: String, enum: ["high", "medium", "low"] },
    assignee: { type: String, ref: "User" },
    deadline: String,
    status: { type: String, enum: ["todo", "in-progress", "blocked", "done"], index: true },
    blockedReason: String,
    completedAt: String,
    dependsOn: [String],
    attachments: [String],
    notes: String,
    discussion: [{ _id: false, by: String, at: String, text: String }],
    subtasks: [{ _id: String, label: String, done: Boolean }],
  },
  { _id: false, versionKey: false }
);

/* ---------- Internal QC ---------- */

export const QCSuiteSchema = new S(
  {
    _id: String,
    pageId: { type: String, ref: "Page", index: true },
    groups: [
      {
        _id: false,
        name: String,
        checks: [{ _id: String, label: String, status: { type: String, enum: ["pass", "fail", "pending"] }, bugId: String }],
      },
    ],
  },
  { _id: false, versionKey: false }
);

export const BugSchema = new S(
  {
    _id: String,
    title: String,
    pageId: { type: String, ref: "Page" },
    severity: { type: String, enum: ["critical", "major", "minor"] },
    status: { type: String, enum: ["open", "fixing", "retest", "closed"], index: true },
    assignee: { type: String, ref: "User" },
    reportedBy: { type: String, ref: "User" },
    reportedAt: String,
    steps: String,
  },
  { _id: false, versionKey: false }
);

/* ---------- Files & assets ---------- */

export const FileAssetSchema = new S(
  {
    _id: String,
    projectId: { type: String, ref: "Project", index: true },
    name: String,
    category: String,
    size: String,
    version: Number,
    updated: String,
    uploadedBy: String,
  },
  { _id: false, versionKey: false }
);

export const UploadRequestSchema = new S(
  {
    _id: String,
    projectId: { type: String, ref: "Project", index: true },
    label: String,
    requestedOn: String,
    status: { type: String, enum: ["pending", "uploaded"] },
    blocks: { type: String, default: null },
  },
  { _id: false, versionKey: false }
);

/* ---------- Credentials vault ---------- */

export const CredentialSchema = new S(
  {
    _id: String,
    projectId: { type: String, ref: "Project", index: true },
    service: String,
    type: String,
    url: String,
    username: String,
    passwordEncrypted: String, // AES-256-GCM; plaintext never stored
    access: [{ type: String, ref: "User" }],
    lastRotated: String,
  },
  { _id: false, versionKey: false }
);

export const VaultLogSchema = new S(
  {
    _id: String,
    user: { type: String, ref: "User" },
    action: String,
    service: String,
    detail: String,
    at: String,
  },
  { _id: false, versionKey: false }
);

/* ---------- Services & renewals ---------- */

export const RenewalSchema = new S(
  {
    _id: String,
    projectId: { type: String, ref: "Project", index: true },
    name: String,
    category: String,
    provider: String,
    expires: String,
    owner: { type: String, ref: "User" },
    remindDaysBefore: Number,
    autoRenew: Boolean,
    cost: String,
  },
  { _id: false, versionKey: false }
);

/* ---------- Meetings, scope & audit ---------- */

export const MeetingSchema = new S(
  {
    _id: String,
    projectId: { type: String, ref: "Project", index: true },
    title: String,
    date: String,
    attendees: [{ type: String, ref: "User" }],
    summary: String,
    decisions: [String],
    actionItems: [{ _id: false, label: String, taskId: String, owner: String }],
  },
  { _id: false, versionKey: false }
);

export const ChangeRequestSchema = new S(
  {
    _id: String,
    projectId: { type: String, ref: "Project", index: true },
    title: String,
    requestedBy: String,
    requestedOn: String,
    status: { type: String, enum: ["new", "estimated", "accepted", "declined", "completed"] },
    costEstimate: String,
    timeEstimate: String,
    impact: String,
  },
  { _id: false, versionKey: false }
);

export const ActivitySchema = new S(
  {
    _id: String,
    projectId: { type: String, ref: "Project", index: true },
    user: { type: String, ref: "User" },
    action: String,
    at: String,
  },
  { _id: false, versionKey: false }
);

export const NotificationSchema = new S(
  {
    _id: String,
    type: String,
    text: String,
    time: String,
    unread: Boolean,
  },
  { _id: false, versionKey: false }
);

export const MODEL_DEFS = {
  User: UserSchema,
  Client: ClientSchema,
  Project: ProjectSchema,
  Milestone: MilestoneSchema,
  TimelinePhase: TimelinePhaseSchema,
  OnboardingStep: OnboardingStepSchema,
  Question: QuestionSchema,
  Page: PageSchema,
  Task: TaskSchema,
  QCSuite: QCSuiteSchema,
  Bug: BugSchema,
  FileAsset: FileAssetSchema,
  UploadRequest: UploadRequestSchema,
  Credential: CredentialSchema,
  VaultLog: VaultLogSchema,
  Renewal: RenewalSchema,
  Meeting: MeetingSchema,
  ChangeRequest: ChangeRequestSchema,
  Activity: ActivitySchema,
  Notification: NotificationSchema,
};

export function buildMongooseModels() {
  const models = {};
  for (const [name, schema] of Object.entries(MODEL_DEFS)) {
    models[name] = mongoose.models[name] || mongoose.model(name, schema);
  }
  return models;
}
