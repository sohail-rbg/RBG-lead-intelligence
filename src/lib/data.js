// Central mock dataset for the RBG Delivery OS demo.
// Today in the demo world: 2026-09-30.

export const TODAY = "2026-09-30";

export const users = [
  { id: "u-priya", name: "Priya Sharma", role: "Project Manager", initials: "PS", color: "bg-violet-600" },
  { id: "u-arjun", name: "Arjun Mehta", role: "Lead Developer", initials: "AM", color: "bg-sky-600" },
  { id: "u-sana", name: "Sana Kapoor", role: "UI/UX Designer", initials: "SK", color: "bg-rose-500" },
  { id: "u-dev", name: "Dev Patel", role: "WordPress Developer", initials: "DP", color: "bg-emerald-600" },
  { id: "u-riya", name: "Riya Verma", role: "QA Engineer", initials: "RV", color: "bg-amber-600" },
  { id: "u-kabir", name: "Kabir Singh", role: "Content Writer", initials: "KS", color: "bg-teal-600" },
  { id: "u-meera", name: "Dr. Meera Nair", role: "Client — Aurora Dental", initials: "MN", color: "bg-indigo-600" },
];

export const userById = (id) => users.find((u) => u.id === id);

export const clients = [
  {
    id: "c-aurora",
    name: "Aurora Dental",
    contact: "Dr. Meera Nair",
    email: "meera@auroradental.in",
    phone: "+91 98100 22334",
    since: "2025-04-12",
    logoBg: "bg-indigo-600",
    initials: "AD",
  },
  {
    id: "c-northgate",
    name: "Northgate Logistics",
    contact: "Vikram Rao",
    email: "vikram@northgate.co.in",
    phone: "+91 98220 11223",
    since: "2026-06-01",
    logoBg: "bg-slate-700",
    initials: "NL",
  },
  {
    id: "c-lotus",
    name: "Lotus Herbals Co.",
    contact: "Anita Deshmukh",
    email: "anita@lotusherbals.in",
    phone: "+91 99100 55667",
    since: "2026-09-08",
    logoBg: "bg-rose-500",
    initials: "LH",
  },
];

export const projects = [
  {
    id: "p-aurora",
    name: "Website Redesign & Build",
    clientId: "c-aurora",
    status: "in-progress", // onboarding | in-progress | qc | approval | launch | maintenance | done
    phase: "Development & Client Approvals",
    progress: 68,
    startDate: "2026-08-18",
    deliveryDate: "2026-10-24",
    scope:
      "Design and build of an 8-page WordPress website for Aurora Dental, including appointment booking integration, SEO foundations, content writing for all service pages, and a 12-month maintenance contract.",
    services: ["WordPress Design & Build", "Content Writing", "SEO Setup", "Booking Integration", "Hosting & Maintenance"],
    team: ["u-priya", "u-arjun", "u-sana", "u-dev", "u-riya", "u-kabir"],
    value: "₹4,80,000",
    onboardingProgress: 72,
    health: "amber", // green | amber | red
    healthNote: "Team photos pending from client — Team page schedule at risk",
  },
  {
    id: "p-northgate",
    name: "Brand Identity Refresh",
    clientId: "c-northgate",
    status: "in-progress",
    phase: "Concept Round 2",
    progress: 42,
    startDate: "2026-09-01",
    deliveryDate: "2026-11-07",
    scope: "Logo refresh, brand guidelines, stationery design and social media templates for Northgate Logistics.",
    services: ["Brand Identity", "Guidelines", "Print Collateral"],
    team: ["u-priya", "u-sana"],
    value: "₹1,60,000",
    onboardingProgress: 100,
    health: "green",
    healthNote: "On track",
  },
  {
    id: "p-lotus",
    name: "E-commerce Store Setup",
    clientId: "c-lotus",
    status: "onboarding",
    phase: "Client Onboarding",
    progress: 8,
    startDate: "2026-09-22",
    deliveryDate: "2026-12-15",
    scope: "WooCommerce store for Lotus Herbals with 40 SKUs, payment gateway, and launch marketing kit.",
    services: ["E-commerce Build", "Product Setup", "Payment Gateway", "Launch Kit"],
    team: ["u-priya", "u-arjun", "u-sana", "u-kabir"],
    value: "₹6,20,000",
    onboardingProgress: 35,
    health: "amber",
    healthNote: "Questionnaire and product catalogue still pending",
  },
];

export const projectById = (id) => projects.find((p) => p.id === id);

/* ---------------- Client onboarding (Aurora) ---------------- */

export const onboardingSteps = [
  {
    id: "welcome",
    title: "Welcome & company details",
    description: "Basic information about Aurora Dental and key contacts.",
    status: "done",
    completedAt: "2026-08-18",
    items: [
      { id: "ob-1", label: "Company profile & address", done: true },
      { id: "ob-2", label: "Primary contact & decision makers", done: true },
      { id: "ob-3", label: "Billing details & GST", done: true },
    ],
  },
  {
    id: "questionnaire",
    title: "Project questionnaire",
    description: "Goals, audience, competitors and design preferences.",
    status: "done",
    completedAt: "2026-08-20",
    items: [
      { id: "ob-4", label: "Business goals & KPIs", done: true },
      { id: "ob-5", label: "Target audience", done: true },
      { id: "ob-6", label: "Competitor links (3 added)", done: true },
      { id: "ob-7", label: "Design likes & dislikes", done: true },
    ],
  },
  {
    id: "brand",
    title: "Brand assets",
    description: "Logos, colours, fonts and photography.",
    status: "done",
    completedAt: "2026-08-24",
    items: [
      { id: "ob-8", label: "Logo pack (SVG + PNG)", done: true },
      { id: "ob-9", label: "Brand colours & fonts", done: true },
      { id: "ob-10", label: "Clinic photography", done: true },
    ],
  },
  {
    id: "content",
    title: "Content upload",
    description: "Copy, images and documents for the website.",
    status: "active",
    items: [
      { id: "ob-11", label: "Service descriptions (6 of 6)", done: true },
      { id: "ob-12", label: "Doctor bios & qualifications", done: true },
      { id: "ob-13", label: "Team photos (awaiting 4 more)", done: false },
      { id: "ob-14", label: "Patient testimonials", done: false },
      { id: "ob-15", label: "Insurance partner logos", done: false },
    ],
  },
  {
    id: "access",
    title: "Required access",
    description: "Accounts and systems we need to complete the work.",
    status: "active",
    items: [
      { id: "ob-16", label: "Domain registrar (GoDaddy)", done: true },
      { id: "ob-17", label: "Google Business Profile", done: true },
      { id: "ob-18", label: "Appointment system admin (Practo)", done: false },
    ],
  },
];

export const onboardingQuestions = [
  {
    id: "q-1",
    question: "Should the booking widget show live Practo slots, or collect requests that your front desk confirms manually?",
    askedBy: "u-priya",
    askedOn: "2026-09-26",
    status: "open", // open | answered
  },
  {
    id: "q-2",
    question: "Do you want the blog open for comments, or keep it read-only?",
    askedBy: "u-priya",
    askedOn: "2026-09-21",
    status: "answered",
    answer: "Read-only is fine — we'll share posts on social instead.",
  },
];

/* ---------------- Pages & approvals ---------------- */
// status: draft | internal-qc | awaiting-approval | approved | changes-requested | revision

export const pages = [
  {
    id: "pg-home",
    name: "Home",
    url: "/home",
    status: "approved",
    version: 3,
    assignee: "u-sana",
    updatedAt: "2026-09-28",
    previewUrl: "https://preview.rbg.studio/aurora/home?v=3",
    qc: { status: "passed", passedOn: "2026-09-24" },
    history: [
      { id: "h-1", version: 1, event: "submitted", by: "u-sana", at: "2026-09-12 16:40" },
      { id: "h-2", version: 1, event: "changes-requested", by: "u-meera", at: "2026-09-15 11:05", note: "Hero feels too clinical; warmer photography please." },
      { id: "h-3", version: 2, event: "submitted", by: "u-sana", at: "2026-09-19 10:12" },
      { id: "h-4", version: 2, event: "changes-requested", by: "u-meera", at: "2026-09-21 09:48", note: "Add insurance partners strip above the footer." },
      { id: "h-5", version: 3, event: "approved", by: "u-meera", at: "2026-09-26 14:22" },
    ],
  },
  {
    id: "pg-about",
    name: "About Us",
    url: "/about",
    status: "awaiting-approval",
    version: 2,
    assignee: "u-dev",
    updatedAt: "2026-09-29",
    previewUrl: "https://preview.rbg.studio/aurora/about?v=2",
    qc: { status: "passed", passedOn: "2026-09-29" },
    history: [
      { id: "h-6", version: 1, event: "submitted", by: "u-dev", at: "2026-09-22 12:30" },
      { id: "h-7", version: 1, event: "changes-requested", by: "u-meera", at: "2026-09-24 17:15", note: "Clinic timeline should start from 2012, not 2015." },
      { id: "h-8", version: 2, event: "submitted", by: "u-dev", at: "2026-09-29 10:05" },
    ],
  },
  {
    id: "pg-services",
    name: "Services",
    url: "/services",
    status: "revision",
    version: 2,
    assignee: "u-dev",
    updatedAt: "2026-09-27",
    previewUrl: "https://preview.rbg.studio/aurora/services?v=2",
    qc: { status: "passed", passedOn: "2026-09-25" },
    history: [
      { id: "h-9", version: 1, event: "submitted", by: "u-dev", at: "2026-09-20 15:45" },
      { id: "h-10", version: 2, event: "submitted", by: "u-dev", at: "2026-09-25 11:20" },
      {
        id: "h-11",
        version: 2,
        event: "changes-requested",
        by: "u-meera",
        at: "2026-09-27 18:02",
        note: "Root canal pricing table is missing the 'with crown' column. Also the implants CTA should say 'Book a consultation', not 'Buy now'.",
        category: "Content",
        attachments: ["services-pricing-missing.png"],
      },
    ],
  },
  {
    id: "pg-team",
    name: "Our Team",
    url: "/team",
    status: "internal-qc",
    version: 1,
    assignee: "u-dev",
    updatedAt: "2026-09-30",
    previewUrl: "https://preview.rbg.studio/aurora/team?v=1",
    qc: { status: "in-progress", progress: 60 },
    history: [{ id: "h-12", version: 1, event: "submitted", by: "u-dev", at: "2026-09-30 09:15" }],
  },
  {
    id: "pg-appointments",
    name: "Appointments",
    url: "/appointments",
    status: "changes-requested",
    version: 1,
    assignee: "u-arjun",
    updatedAt: "2026-09-26",
    previewUrl: "https://preview.rbg.studio/aurora/appointments?v=1",
    qc: { status: "passed", passedOn: "2026-09-23" },
    history: [
      { id: "h-13", version: 1, event: "submitted", by: "u-arjun", at: "2026-09-23 13:00" },
      {
        id: "h-14",
        version: 1,
        event: "changes-requested",
        by: "u-meera",
        at: "2026-09-26 10:40",
        note: "Date picker allows selecting Sundays — clinic is closed on Sundays. Also need a wheelchair-accessible appointment tag.",
        category: "Functionality",
        attachments: ["sunday-select-bug.png"],
      },
    ],
  },
  {
    id: "pg-blog",
    name: "Blog",
    url: "/blog",
    status: "internal-qc",
    version: 1,
    assignee: "u-dev",
    updatedAt: "2026-09-29",
    previewUrl: "https://preview.rbg.studio/aurora/blog?v=1",
    qc: { status: "in-progress", progress: 35 },
    history: [{ id: "h-15", version: 1, event: "submitted", by: "u-dev", at: "2026-09-29 17:30" }],
  },
  {
    id: "pg-contact",
    name: "Contact",
    url: "/contact",
    status: "approved",
    version: 1,
    assignee: "u-dev",
    updatedAt: "2026-09-22",
    previewUrl: "https://preview.rbg.studio/aurora/contact?v=1",
    qc: { status: "passed", passedOn: "2026-09-21" },
    history: [
      { id: "h-16", version: 1, event: "submitted", by: "u-dev", at: "2026-09-21 12:10" },
      { id: "h-17", version: 1, event: "approved", by: "u-meera", at: "2026-09-22 15:55" },
    ],
  },
  {
    id: "pg-privacy",
    name: "Privacy Policy",
    url: "/privacy",
    status: "draft",
    version: 1,
    assignee: "u-kabir",
    updatedAt: "2026-09-28",
    previewUrl: "https://preview.rbg.studio/aurora/privacy?v=1",
    qc: { status: "not-started" },
    history: [],
  },
];

export const pageById = (id) => pages.find((p) => p.id === id);

/* ---------------- Tasks ---------------- */

export const tasks = [
  {
    id: "t-101",
    title: "Fix Services pricing table — add 'with crown' column",
    pageId: "pg-services",
    source: "feedback",
    priority: "high",
    assignee: "u-dev",
    deadline: "2026-10-02",
    status: "in-progress",
    dependsOn: [],
    attachments: ["services-pricing-missing.png"],
    notes: "Client flagged in v2 feedback. Use the rate card from the content vault.",
    discussion: [
      { by: "u-meera", at: "2026-09-27 18:02", text: "Root canal pricing table is missing the 'with crown' column." },
      { by: "u-dev", at: "2026-09-28 09:30", text: "Picking this up today — will also fix the implants CTA copy." },
    ],
    subtasks: [
      { id: "st-1", label: "Add crown column to pricing table", done: true },
      { id: "st-2", label: "Change implants CTA to 'Book a consultation'", done: true },
      { id: "st-3", label: "Cross-check all prices with rate card PDF", done: false },
    ],
  },
  {
    id: "t-102",
    title: "Block Sundays in appointment date picker + add accessibility tag",
    pageId: "pg-appointments",
    source: "feedback",
    priority: "high",
    assignee: "u-arjun",
    deadline: "2026-10-03",
    status: "todo",
    dependsOn: [],
    attachments: ["sunday-select-bug.png"],
    notes: "Practo settings may already restrict this — check before custom code.",
    discussion: [],
    subtasks: [],
  },
  {
    id: "t-103",
    title: "Collect remaining team photos (4 doctors)",
    pageId: "pg-team",
    source: "task",
    priority: "medium",
    assignee: "u-priya",
    deadline: "2026-10-01",
    status: "blocked",
    blockedReason: "Waiting on client upload",
    dependsOn: [],
    attachments: [],
    notes: "Reminded Dr. Nair on 26 Sep call. Escalate if not received by 1 Oct.",
    discussion: [],
    subtasks: [],
  },
  {
    id: "t-104",
    title: "QC pass — Our Team page",
    pageId: "pg-team",
    source: "task",
    priority: "medium",
    assignee: "u-riya",
    deadline: "2026-10-01",
    status: "in-progress",
    dependsOn: ["t-103"],
    attachments: [],
    notes: "Responsive + accessibility checks remaining.",
    discussion: [],
    subtasks: [],
  },
  {
    id: "t-105",
    title: "QC pass — Blog page",
    pageId: "pg-blog",
    source: "task",
    priority: "medium",
    assignee: "u-riya",
    deadline: "2026-10-02",
    status: "todo",
    dependsOn: [],
    attachments: [],
    notes: "",
    discussion: [],
    subtasks: [],
  },
  {
    id: "t-106",
    title: "Draft Privacy Policy per DPDP Act checklist",
    pageId: "pg-privacy",
    source: "task",
    priority: "low",
    assignee: "u-kabir",
    deadline: "2026-10-08",
    status: "in-progress",
    dependsOn: [],
    attachments: [],
    notes: "Use legal template v3; needs client legal review before approval.",
    discussion: [],
    subtasks: [],
  },
  {
    id: "t-107",
    title: "Setup staging → production deployment checklist",
    pageId: null,
    source: "task",
    priority: "medium",
    assignee: "u-arjun",
    deadline: "2026-10-15",
    status: "todo",
    dependsOn: [],
    attachments: [],
    notes: "",
    discussion: [],
    subtasks: [],
  },
  {
    id: "t-108",
    title: "Northgate — Round 2 logo concepts",
    pageId: null,
    projectId: "p-northgate",
    source: "task",
    priority: "high",
    assignee: "u-sana",
    deadline: "2026-10-04",
    status: "in-progress",
    dependsOn: [],
    attachments: [],
    notes: "",
    discussion: [],
    subtasks: [],
  },
  {
    id: "t-109",
    title: "Lotus — finish onboarding questionnaire review",
    pageId: null,
    projectId: "p-lotus",
    source: "task",
    priority: "medium",
    assignee: "u-priya",
    deadline: "2026-10-02",
    status: "todo",
    dependsOn: [],
    attachments: [],
    notes: "Catalogue of 40 SKUs still pending from client.",
    discussion: [],
    subtasks: [],
  },
  {
    id: "t-110",
    title: "Write testimonial copy blocks for Home",
    pageId: "pg-home",
    source: "task",
    priority: "low",
    assignee: "u-kabir",
    deadline: "2026-09-26",
    status: "done",
    completedAt: "2026-09-25",
    dependsOn: [],
    attachments: [],
    notes: "",
    discussion: [],
    subtasks: [],
  },
];

/* ---------------- Timeline ---------------- */

export const milestones = [
  { id: "m-1", name: "Kickoff & discovery", date: "2026-08-22", status: "done" },
  { id: "m-2", name: "Design approved", date: "2026-09-12", status: "done" },
  { id: "m-3", name: "All pages in client approval", date: "2026-10-10", status: "upcoming" },
  { id: "m-4", name: "Final sign-off", date: "2026-10-17", status: "upcoming" },
  { id: "m-5", name: "Launch", date: "2026-10-24", status: "upcoming" },
];

export const timelinePhases = [
  { id: "ph-1", name: "Discovery & planning", planned: ["2026-08-18", "2026-08-22"], actual: ["2026-08-18", "2026-08-22"] },
  { id: "ph-2", name: "UX & visual design", planned: ["2026-08-25", "2026-09-12"], actual: ["2026-08-25", "2026-09-12"] },
  { id: "ph-3", name: "Content production", planned: ["2026-09-01", "2026-09-24"], actual: ["2026-09-01", "2026-09-26"] },
  { id: "ph-4", name: "Development", planned: ["2026-09-08", "2026-10-08"], actual: ["2026-09-08", null] },
  { id: "ph-5", name: "QC & revisions", planned: ["2026-09-22", "2026-10-14"], actual: ["2026-09-22", null] },
  { id: "ph-6", name: "Client approvals", planned: ["2026-09-29", "2026-10-17"], actual: ["2026-09-29", null] },
  { id: "ph-7", name: "Launch & handover", planned: ["2026-10-20", "2026-10-24"], actual: [null, null] },
];

export const upcomingDeliveries = [
  { id: "d-1", title: "Services page v3 (revision)", due: "2026-10-02", owner: "u-dev", type: "Revision" },
  { id: "d-2", title: "Appointments fix — Sundays + accessibility tag", due: "2026-10-03", owner: "u-arjun", type: "Fix" },
  { id: "d-3", title: "Our Team page → client approval", due: "2026-10-05", owner: "u-riya", type: "Approval" },
  { id: "d-4", title: "Blog page → client approval", due: "2026-10-07", owner: "u-riya", type: "Approval" },
  { id: "d-5", title: "Privacy Policy draft", due: "2026-10-08", owner: "u-kabir", type: "Content" },
];

/* ---------------- Internal QC ---------------- */

export const qcSuites = [
  {
    pageId: "pg-team",
    groups: [
      {
        name: "Responsive testing",
        checks: [
          { id: "qc-1", label: "Mobile (390px) — layout & tap targets", status: "pass" },
          { id: "qc-2", label: "Tablet (768px) — layout & images", status: "pass" },
          { id: "qc-3", label: "Desktop (1440px) — spacing & alignment", status: "pass" },
          { id: "qc-4", label: "Large screens (1920px) — max-width behaviour", status: "pending" },
        ],
      },
      {
        name: "Functional testing",
        checks: [
          { id: "qc-5", label: "All internal links resolve", status: "pass" },
          { id: "qc-6", label: "Doctor filter chips work", status: "fail", bugId: "b-21" },
          { id: "qc-7", label: "Profile modals open/close correctly", status: "pending" },
        ],
      },
      {
        name: "Accessibility",
        checks: [
          { id: "qc-8", label: "Alt text on all images", status: "pass" },
          { id: "qc-9", label: "Keyboard navigation through profiles", status: "pending" },
          { id: "qc-10", label: "Colour contrast ≥ 4.5:1", status: "pending" },
        ],
      },
    ],
  },
];

export const bugs = [
  {
    id: "b-21",
    title: "Doctor filter chips don't reset when switching specialties",
    pageId: "pg-team",
    severity: "major",
    status: "open", // open | fixing | retest | closed
    assignee: "u-dev",
    reportedBy: "u-riya",
    reportedAt: "2026-09-30 10:20",
    steps: "Select 'Implantologist', then 'All'. Grid still shows only implantologists.",
  },
  {
    id: "b-18",
    title: "Blog featured image overflows card on 320px screens",
    pageId: "pg-blog",
    severity: "minor",
    status: "retest",
    assignee: "u-dev",
    reportedBy: "u-riya",
    reportedAt: "2026-09-29 15:02",
    steps: "Open /blog on iPhone SE viewport; third card image bleeds past card border.",
  },
  {
    id: "b-15",
    title: "Contact form honeypot visible with CSS disabled",
    pageId: "pg-contact",
    severity: "minor",
    status: "closed",
    assignee: "u-arjun",
    reportedBy: "u-riya",
    reportedAt: "2026-09-20 11:40",
    steps: "Disable styles; hidden field renders. Fixed with position:absolute + clip.",
  },
];

/* ---------------- Files & assets ---------------- */

export const files = [
  { id: "f-1", name: "aurora-logo-pack.zip", category: "Brand", size: "8.2 MB", version: 2, updated: "2026-08-24", uploadedBy: "c-aurora" },
  { id: "f-2", name: "brand-guidelines-v2.pdf", category: "Brand", size: "3.1 MB", version: 2, updated: "2026-08-24", uploadedBy: "u-sana" },
  { id: "f-3", name: "clinic-photography.zip", category: "Images", size: "148 MB", version: 1, updated: "2026-08-22", uploadedBy: "c-aurora" },
  { id: "f-4", name: "team-photos-batch-1.zip", category: "Images", size: "62 MB", version: 1, updated: "2026-09-18", uploadedBy: "c-aurora" },
  { id: "f-5", name: "service-descriptions-final.docx", category: "Copy", size: "0.4 MB", version: 3, updated: "2026-09-16", uploadedBy: "u-kabir" },
  { id: "f-6", name: "rate-card-2026.pdf", category: "Copy", size: "0.2 MB", version: 1, updated: "2026-09-24", uploadedBy: "c-aurora" },
  { id: "f-7", name: "aurora-website-contract.pdf", category: "Contracts", size: "1.1 MB", version: 1, updated: "2026-08-16", uploadedBy: "u-priya" },
  { id: "f-8", name: "homepage-design-v3.fig", category: "Working files", size: "24 MB", version: 3, updated: "2026-09-19", uploadedBy: "u-sana" },
  { id: "f-9", name: "contact-page-final.pdf", category: "Deliverables", size: "0.9 MB", version: 1, updated: "2026-09-22", uploadedBy: "u-priya" },
];

export const clientUploadRequests = [
  { id: "ur-1", label: "Team photos — 4 remaining doctors", requestedOn: "2026-09-24", status: "pending", blocks: "Our Team page" },
  { id: "ur-2", label: "Patient testimonials (min 5)", requestedOn: "2026-09-24", status: "pending", blocks: "Home testimonials" },
  { id: "ur-3", label: "Insurance partner logos", requestedOn: "2026-09-20", status: "uploaded", blocks: null },
];

/* ---------------- Credentials vault ---------------- */

export const credentials = [
  {
    id: "cr-1",
    service: "WordPress (staging)",
    type: "Hosting",
    url: "https://staging.auroradental.rbg.studio/wp-admin",
    username: "aurora_admin",
    password: "stg#Aur0ra!2026",
    access: ["u-priya", "u-arjun", "u-dev"],
    lastRotated: "2026-09-10",
  },
  {
    id: "cr-2",
    service: "Hostinger hosting panel",
    type: "Hosting",
    url: "https://hpanel.hostinger.com",
    username: "ops@rbg.studio",
    password: "Hpanel!Rbg$88",
    access: ["u-priya", "u-arjun"],
    lastRotated: "2026-08-30",
  },
  {
    id: "cr-3",
    service: "SFTP — production",
    type: "FTP/SFTP",
    url: "sftp://auroradental.in:2222",
    username: "aurora-sftp",
    password: "ftp#Pr0d!A26",
    access: ["u-arjun"],
    lastRotated: "2026-09-10",
  },
  {
    id: "cr-4",
    service: "GoDaddy (domain)",
    type: "Domain",
    url: "https://dcc.godaddy.com",
    username: "meera@auroradental.in",
    password: "Gd!Aurora#24",
    access: ["u-priya"],
    lastRotated: "2026-07-15",
  },
  {
    id: "cr-5",
    service: "Cloudflare DNS",
    type: "DNS",
    url: "https://dash.cloudflare.com",
    username: "dns@rbg.studio",
    password: "Cf#Z0ne!2026",
    access: ["u-arjun"],
    lastRotated: "2026-09-02",
  },
  {
    id: "cr-6",
    service: "Practo clinic admin",
    type: "Other",
    url: "https://www.practo.com/clinic",
    username: "frontdesk@auroradental.in",
    password: "Pr@cto!Clinic9",
    access: ["u-priya", "u-arjun"],
    lastRotated: "2026-09-18",
  },
];

export const vaultAccessLog = [
  { at: "2026-09-30 09:42", user: "u-dev", action: "Revealed password", service: "WordPress (staging)" },
  { at: "2026-09-29 16:10", user: "u-arjun", action: "Revealed password", service: "Cloudflare DNS" },
  { at: "2026-09-28 11:25", user: "u-priya", action: "Granted access", service: "GoDaddy (domain)", detail: "to u-arjun" },
  { at: "2026-09-26 14:02", user: "u-arjun", action: "Rotated password", service: "SFTP — production" },
];

/* ---------------- Services & renewals ---------------- */

export const renewalServices = [
  {
    id: "s-1",
    name: "Domain — auroradental.in",
    category: "Domain",
    provider: "GoDaddy",
    expires: "2026-11-12",
    owner: "u-priya",
    remindDaysBefore: 30,
    autoRenew: false,
    cost: "₹1,199/yr",
  },
  {
    id: "s-2",
    name: "Hosting — Hostinger Business",
    category: "Hosting",
    provider: "Hostinger",
    expires: "2027-01-15",
    owner: "u-arjun",
    remindDaysBefore: 45,
    autoRenew: true,
    cost: "₹7,080/yr",
  },
  {
    id: "s-3",
    name: "SSL certificate",
    category: "SSL",
    provider: "Let's Encrypt (via Hostinger)",
    expires: "2026-10-21",
    owner: "u-arjun",
    remindDaysBefore: 14,
    autoRenew: true,
    cost: "Included",
  },
  {
    id: "s-4",
    name: "WP Rocket license",
    category: "Paid plugin",
    provider: "WP Media",
    expires: "2026-12-02",
    owner: "u-dev",
    remindDaysBefore: 30,
    autoRenew: false,
    cost: "$59/yr",
  },
  {
    id: "s-5",
    name: "Maintenance contract",
    category: "Contract",
    provider: "RBG Digital",
    expires: "2026-12-31",
    owner: "u-priya",
    remindDaysBefore: 60,
    autoRenew: false,
    cost: "₹9,500/mo",
  },
];

/* ---------------- Meetings, scope, activity ---------------- */

export const meetings = [
  {
    id: "mt-1",
    title: "Weekly review — Aurora",
    date: "2026-09-26",
    attendees: ["u-priya", "u-sana", "u-meera"],
    summary: "Reviewed Services v2 feedback, agreed team-photo deadline of 1 Oct, discussed booking flow approach.",
    decisions: [
      "Booking widget to use Practo live slots (pending q-1 answer)",
      "Team photos due 1 Oct or Team page slips to next sprint",
    ],
    actionItems: [
      { label: "Remind client about team photos", taskId: "t-103", owner: "u-priya" },
      { label: "Fix Services pricing table", taskId: "t-101", owner: "u-dev" },
    ],
  },
  {
    id: "mt-2",
    title: "Design review — Home v3",
    date: "2026-09-22",
    attendees: ["u-sana", "u-kabir", "u-meera"],
    summary: "Client happy with warmer hero imagery; approved insurance strip placement.",
    decisions: ["Home v3 approved as presented"],
    actionItems: [{ label: "Publish Home v3 to staging", taskId: null, owner: "u-dev" }],
  },
];

export const changeRequests = [
  {
    id: "cr-101",
    title: "Add Hindi language version of Services page",
    requestedBy: "c-aurora",
    requestedOn: "2026-09-24",
    status: "estimated", // new | estimated | accepted | declined | completed
    costEstimate: "₹28,000",
    timeEstimate: "+6 working days",
    impact: "Launch moves from 24 Oct to 3 Nov if accepted",
  },
];

export const activity = [
  { at: "2026-09-30 09:15", user: "u-dev", action: "submitted Our Team v1 for internal QC" },
  { at: "2026-09-29 17:30", user: "u-dev", action: "submitted Blog v1 for internal QC" },
  { at: "2026-09-29 10:05", user: "u-dev", action: "resubmitted About Us v2 for client approval" },
  { at: "2026-09-27 18:02", user: "u-meera", action: "requested changes on Services v2 (Content)" },
  { at: "2026-09-26 14:22", user: "u-meera", action: "approved Home v3" },
  { at: "2026-09-26 10:40", user: "u-meera", action: "requested changes on Appointments v1 (Functionality)" },
  { at: "2026-09-25 11:20", user: "u-dev", action: "submitted Services v2 for client approval" },
  { at: "2026-09-24 17:15", user: "u-meera", action: "requested changes on About Us v1" },
];

/* ---------------- Notifications ---------------- */

export const notifications = [
  { id: "n-1", type: "approval", text: "About Us v2 is waiting for client approval", time: "2h ago", unread: true },
  { id: "n-2", type: "overdue", text: "Team photos upload is 6 days overdue", time: "5h ago", unread: true },
  { id: "n-3", type: "qc", text: "New bug b-21 reported on Our Team", time: "Yesterday", unread: true },
  { id: "n-4", type: "renewal", text: "SSL certificate renews in 21 days (auto)", time: "Yesterday", unread: false },
  { id: "n-5", type: "onboarding", text: "Lotus Herbals onboarding 35% — questionnaire pending", time: "2d ago", unread: false },
];

/* ---------------- Reports ---------------- */

export const reportStats = {
  activeProjects: 3,
  pagesAwaitingClient: 1,
  avgApprovalTurnaround: "2.1 days",
  revisionRounds: { home: 3, about: 2, services: 2, contact: 1 },
  qcPassRate: 87,
  overdueTasks: 1,
  workload: [
    { user: "u-dev", tasks: 4, capacity: 70 },
    { user: "u-sana", tasks: 3, capacity: 55 },
    { user: "u-arjun", tasks: 3, capacity: 45 },
    { user: "u-riya", tasks: 2, capacity: 80 },
    { user: "u-kabir", tasks: 2, capacity: 30 },
    { user: "u-priya", tasks: 3, capacity: 60 },
  ],
  deliveryRisks: [
    { id: "r-1", severity: "high", text: "Team photos overdue — Our Team page QC blocked", projectId: "p-aurora" },
    { id: "r-2", severity: "medium", text: "Practo access not shared — booking integration on hold", projectId: "p-aurora" },
    { id: "r-3", severity: "low", text: "Hindi version change request may shift launch", projectId: "p-aurora" },
  ],
};

export const statusMeta = {
  "draft": { label: "Draft", className: "bg-zinc-100 text-zinc-600 border-zinc-200" },
  "internal-qc": { label: "Internal QC", className: "bg-sky-50 text-sky-700 border-sky-200" },
  "awaiting-approval": { label: "Awaiting approval", className: "bg-amber-50 text-amber-700 border-amber-200" },
  "approved": { label: "Approved", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  "changes-requested": { label: "Changes requested", className: "bg-rose-50 text-rose-700 border-rose-200" },
  "revision": { label: "In revision", className: "bg-violet-50 text-violet-700 border-violet-200" },
  "todo": { label: "To do", className: "bg-zinc-100 text-zinc-600 border-zinc-200" },
  "in-progress": { label: "In progress", className: "bg-sky-50 text-sky-700 border-sky-200" },
  "blocked": { label: "Blocked", className: "bg-rose-50 text-rose-700 border-rose-200" },
  "done": { label: "Done", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  "open": { label: "Open", className: "bg-rose-50 text-rose-700 border-rose-200" },
  "fixing": { label: "Fixing", className: "bg-sky-50 text-sky-700 border-sky-200" },
  "retest": { label: "Retest", className: "bg-amber-50 text-amber-700 border-amber-200" },
  "closed": { label: "Closed", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  "onboarding": { label: "Onboarding", className: "bg-violet-50 text-violet-700 border-violet-200" },
  "maintenance": { label: "Maintenance", className: "bg-zinc-100 text-zinc-600 border-zinc-200" },
  "launch": { label: "Launch", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  "new": { label: "New", className: "bg-zinc-100 text-zinc-600 border-zinc-200" },
  "estimated": { label: "Estimated", className: "bg-sky-50 text-sky-700 border-sky-200" },
  "accepted": { label: "Accepted", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  "declined": { label: "Declined", className: "bg-zinc-100 text-zinc-500 border-zinc-200" },
  "pending": { label: "Pending", className: "bg-amber-50 text-amber-700 border-amber-200" },
  "uploaded": { label: "Uploaded", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  "answered": { label: "Answered", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};
