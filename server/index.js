// RBG Outreach — Express API server.
// Serves the /api surface, tracking pixel + click redirect, and analytics.
const express = require("express");
const cors = require("cors");
const Papa = require("papaparse");
const XLSX = require("xlsx");
const dbm = require("./db");
const crypto = require("./crypto");
const mailer = require("./mailer");
const sender = require("./sender");

const app = express();
app.use(cors());
app.use(express.json({ limit: "25mb" }));
app.use(express.text({ limit: "25mb", type: "text/csv" }));

const ok = (res, data) => res.json({ ok: true, data });
const fail = (res, code, message) => res.status(code).json({ ok: false, error: message });
const wrap = (handler) => (req, res) => {
  try {
    const out = handler(req, res);
    if (out && typeof out.then === "function") {
      out.catch((err) => {
        console.error(err);
        fail(res, 500, err.message || "Server error");
      });
    }
  } catch (err) {
    console.error(err);
    fail(res, 500, err.message || "Server error");
  }
};

/* ------------------------------- health --------------------------------- */
app.get("/api/health", wrap((req, res) => ok(res, { status: "up", time: dbm.now() })));

/* ----------------------------- SMTP profiles ---------------------------- */
app.get("/api/smtp-profiles", wrap((req, res) => {
  const rows = dbm.all("SELECT id, name, host, port, secure, user, from_name, from_email, created_at FROM smtp_profiles ORDER BY id DESC");
  ok(res, rows);
}));

app.post("/api/smtp-profiles", wrap((req, res) => {
  const { name, host, port, secure, user, password, from_name, from_email } = req.body || {};
  if (!name || !host || !port || !user || !password) return fail(res, 400, "Missing required fields");
  const { lastID } = dbm.run(
    "INSERT INTO smtp_profiles (name, host, port, secure, user, pass_encrypted, from_name, from_email, created_at) VALUES (?,?,?,?,?,?,?,?,?)",
    [name, host, Number(port), secure ? 1 : 0, user, crypto.encrypt(password), from_name || "", from_email || "", dbm.now()]
  );
  ok(res, { id: lastID });
}));

app.put("/api/smtp-profiles/:id", wrap((req, res) => {
  const { id } = req.params;
  const existing = dbm.get("SELECT * FROM smtp_profiles WHERE id = ?", [id]);
  if (!existing) return fail(res, 404, "Profile not found");
  const b = req.body || {};
  const passEncrypted = b.password ? crypto.encrypt(b.password) : existing.pass_encrypted;
  dbm.run(
    "UPDATE smtp_profiles SET name=?, host=?, port=?, secure=?, user=?, pass_encrypted=?, from_name=?, from_email=? WHERE id=?",
    [
      b.name ?? existing.name,
      b.host ?? existing.host,
      Number(b.port ?? existing.port),
      (b.secure ?? !!Number(existing.secure)) ? 1 : 0,
      b.user ?? existing.user,
      passEncrypted,
      b.from_name ?? existing.from_name,
      b.from_email ?? existing.from_email,
      id,
    ]
  );
  ok(res, { updated: true });
}));

app.delete("/api/smtp-profiles/:id", wrap((req, res) => {
  dbm.run("DELETE FROM smtp_profiles WHERE id = ?", [req.params.id]);
  ok(res, { deleted: true });
}));

app.post("/api/smtp-profiles/:id/test", wrap(async (req, res) => {
  const profile = dbm.get("SELECT * FROM smtp_profiles WHERE id = ?", [req.params.id]);
  if (!profile) return fail(res, 404, "Profile not found");
  const result = await mailer.verify(profile);
  ok(res, result);
}));

/* ------------------------------- contacts -------------------------------- */
app.get("/api/contacts", wrap((req, res) => {
  const { q = "", group = "", tag = "" } = req.query;
  let sql = "SELECT * FROM contacts";
  const where = [];
  const params = [];
  if (q) {
    where.push("(email LIKE ? OR first_name LIKE ? OR last_name LIKE ? OR company LIKE ?)");
    const like = `%${q}%`;
    params.push(like, like, like, like);
  }
  if (group) {
    where.push("group_name = ?");
    params.push(group);
  }
  if (tag) {
    where.push("tags LIKE ?");
    params.push(`%"${tag}"%`);
  }
  if (where.length) sql += " WHERE " + where.join(" AND ");
  sql += " ORDER BY id DESC";
  ok(res, dbm.all(sql, params));
}));

// Export contacts as CSV. Declared before the :id route so "export" isn't read as an id.
app.get("/api/contacts/export", wrap((req, res) => {
  const rows = dbm.all("SELECT email, first_name, last_name, company, phone, group_name, tags, status FROM contacts ORDER BY id");
  const csv = Papa.unparse(rows);
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=contacts.csv");
  res.send(csv);
}));

app.get("/api/contacts/:id", wrap((req, res) => {
  const c = dbm.get("SELECT * FROM contacts WHERE id = ?", [req.params.id]);
  if (!c) return fail(res, 404, "Contact not found");
  ok(res, c);
}));

app.post("/api/contacts", wrap((req, res) => {
  const b = req.body || {};
  if (!b.email) return fail(res, 400, "Email is required");
  const exists = dbm.get("SELECT id FROM contacts WHERE email = ?", [b.email]);
  if (exists) return fail(res, 409, "A contact with this email already exists");
  const { lastID } = dbm.run(
    "INSERT INTO contacts (email, first_name, last_name, company, phone, tags, group_name, extra, status, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
    [b.email, b.first_name || "", b.last_name || "", b.company || "", b.phone || "",
      JSON.stringify(b.tags || []), b.group_name || "", JSON.stringify(b.extra || {}), b.status || "active", dbm.now(), dbm.now()]
  );
  ok(res, { id: lastID });
}));

app.put("/api/contacts/:id", wrap((req, res) => {
  const existing = dbm.get("SELECT * FROM contacts WHERE id = ?", [req.params.id]);
  if (!existing) return fail(res, 404, "Contact not found");
  const b = req.body || {};
  dbm.run(
    "UPDATE contacts SET first_name=?, last_name=?, company=?, phone=?, tags=?, group_name=?, extra=?, status=?, updated_at=? WHERE id=?",
    [b.first_name ?? existing.first_name, b.last_name ?? existing.last_name, b.company ?? existing.company,
      b.phone ?? existing.phone, JSON.stringify(b.tags ?? safeParse(existing.tags, [])),
      b.group_name ?? existing.group_name, JSON.stringify(b.extra ?? safeParse(existing.extra, {})),
      b.status ?? existing.status, dbm.now(), req.params.id]
  );
  ok(res, { updated: true });
}));

app.delete("/api/contacts/:id", wrap((req, res) => {
  dbm.run("DELETE FROM contacts WHERE id = ?", [req.params.id]);
  ok(res, { deleted: true });
}));

// Import CSV or XLSX with column detection + duplicate removal.
app.post("/api/contacts/import", wrap((req, res) => {
  const { filename = "", content = "" } = req.body || {};
  if (!content) return fail(res, 400, "No file content provided");
  const isXlsx = /\.(xlsx|xls)$/i.test(filename);
  let records = [];
  if (isXlsx) {
    const wb = XLSX.read(Buffer.from(content, "base64"), { type: "buffer" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    records = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  } else {
    const parsed = Papa.parse(content, { header: true, skipEmptyLines: true });
    records = parsed.data;
  }
  if (!records.length) return fail(res, 400, "No rows found in file");

  const headers = Object.keys(records[0]);
  const map = detectColumns(headers);

  let imported = 0, duplicates = 0, invalid = 0;
  const seen = new Set();
  for (const row of records) {
    const email = normalizeEmail(row[map.email] || "");
    if (!email || !/.+@.+\..+/.test(email)) { invalid++; continue; }
    if (seen.has(email)) { duplicates++; continue; }
    seen.add(email);
    const exists = dbm.get("SELECT id FROM contacts WHERE email = ?", [email]);
    if (exists) { duplicates++; continue; }
    const extra = {};
    for (const h of headers) if (h !== map.email) extra[h] = row[h];
    dbm.run(
      "INSERT INTO contacts (email, first_name, last_name, company, phone, tags, group_name, extra, status, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
      [email, row[map.first_name] || "", row[map.last_name] || "", row[map.company] || "", row[map.phone] || "",
        "[]", "", JSON.stringify(extra), "active", dbm.now(), dbm.now()]
    );
    imported++;
  }
  ok(res, { imported, duplicates, invalid, detected: map });
}));

// Remove duplicate emails, keeping the earliest record.
app.post("/api/contacts/dedupe", wrap((req, res) => {
  const dups = dbm.all(
    "SELECT email, MIN(id) AS keep FROM contacts GROUP BY email HAVING COUNT(*) > 1"
  );
  let removed = 0;
  for (const d of dups) {
    const info = dbm.run("DELETE FROM contacts WHERE email = ? AND id != ?", [d.email, d.keep]);
    removed += 1;
  }
  ok(res, { removedGroups: dups.length, note: "kept the earliest record per email" });
}));

// Export contacts as CSV.
/* ------------------------------- templates ------------------------------- */
app.get("/api/templates", wrap((req, res) => ok(res, dbm.all("SELECT * FROM templates ORDER BY id DESC"))));
app.get("/api/templates/:id", wrap((req, res) => {
  const t = dbm.get("SELECT * FROM templates WHERE id = ?", [req.params.id]);
  if (!t) return fail(res, 404, "Template not found");
  ok(res, t);
}));
app.post("/api/templates", wrap((req, res) => {
  const b = req.body || {};
  if (!b.name) return fail(res, 400, "Template name is required");
  const { lastID } = dbm.run(
    "INSERT INTO templates (name, subject, html, text, signature, variables, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?)",
    [b.name, b.subject || "", b.html || "", b.text || "", b.signature || "", JSON.stringify(b.variables || []), dbm.now(), dbm.now()]
  );
  ok(res, { id: lastID });
}));
app.put("/api/templates/:id", wrap((req, res) => {
  const existing = dbm.get("SELECT * FROM templates WHERE id = ?", [req.params.id]);
  if (!existing) return fail(res, 404, "Template not found");
  const b = req.body || {};
  dbm.run(
    "UPDATE templates SET name=?, subject=?, html=?, text=?, signature=?, variables=?, updated_at=? WHERE id=?",
    [b.name ?? existing.name, b.subject ?? existing.subject, b.html ?? existing.html, b.text ?? existing.text,
      b.signature ?? existing.signature, JSON.stringify(b.variables ?? safeParse(existing.variables, [])), dbm.now(), req.params.id]
  );
  ok(res, { updated: true });
}));
app.delete("/api/templates/:id", wrap((req, res) => {
  dbm.run("DELETE FROM templates WHERE id = ?", [req.params.id]);
  ok(res, { deleted: true });
}));

/* ------------------------------- campaigns ------------------------------- */
app.get("/api/campaigns", wrap((req, res) => {
  const rows = dbm.all("SELECT * FROM campaigns ORDER BY id DESC");
  ok(res, rows.map((c) => ({ ...c, running: sender.isRunning(c.id), state: sender.stateOf(c.id) })));
}));

app.get("/api/campaigns/:id", wrap((req, res) => {
  const c = dbm.get("SELECT * FROM campaigns WHERE id = ?", [req.params.id]);
  if (!c) return fail(res, 404, "Campaign not found");
  ok(res, { ...c, running: sender.isRunning(c.id), state: sender.stateOf(c.id) });
}));

app.get("/api/campaigns/:id/recipients", wrap((req, res) => {
  ok(res, dbm.all("SELECT * FROM campaign_recipients WHERE campaign_id = ? ORDER BY id", [req.params.id]));
}));

app.get("/api/campaigns/:id/events", wrap((req, res) => {
  ok(res, dbm.all("SELECT * FROM events WHERE campaign_id = ? ORDER BY id DESC LIMIT 200", [req.params.id]));
}));

// Create a campaign from a template + SMTP profile + a set of contacts (ids or filter).
app.post("/api/campaigns", wrap((req, res) => {
  const b = req.body || {};
  if (!b.name || !b.template_id || !b.smtp_profile_id) return fail(res, 400, "Missing required fields");
  let contacts = [];
  if (Array.isArray(b.contact_ids) && b.contact_ids.length) {
    const marks = b.contact_ids.map(() => "?").join(",");
    contacts = dbm.all(`SELECT * FROM contacts WHERE id IN (${marks})`, b.contact_ids);
  } else {
    contacts = dbm.all("SELECT * FROM contacts WHERE status = 'active'");
  }
  if (!contacts.length) return fail(res, 400, "No contacts to include");

  const { lastID: campaignId } = dbm.run(
    "INSERT INTO campaigns (name, template_id, smtp_profile_id, status, total, delay_min, delay_max, created_at) VALUES (?,?,?,?,?,?,?,?)",
    [b.name, b.template_id, b.smtp_profile_id, "draft", contacts.length, Number(b.delay_min) || 2000, Number(b.delay_max) || 8000, dbm.now()]
  );
  for (const c of contacts) {
    dbm.run("INSERT INTO campaign_recipients (campaign_id, contact_id, email, status) VALUES (?,?,?,?)",
      [campaignId, c.id, c.email, "pending"]);
  }
  dbm.run("INSERT INTO events (type, campaign_id, at, meta) VALUES (?,?,?,?)",
    ["campaign_created", campaignId, dbm.now(), JSON.stringify({ total: contacts.length })]);
  ok(res, { id: campaignId, total: contacts.length });
}));

app.post("/api/campaigns/:id/start", wrap((req, res) => {
  sender.start(Number(req.params.id));
  ok(res, { started: true });
}));
app.post("/api/campaigns/:id/pause", wrap((req, res) => { sender.pause(Number(req.params.id)); ok(res, { paused: true }); }));
app.post("/api/campaigns/:id/resume", wrap((req, res) => { sender.resume(Number(req.params.id)); ok(res, { resumed: true }); }));
app.post("/api/campaigns/:id/stop", wrap((req, res) => { sender.stop(Number(req.params.id)); ok(res, { stopped: true }); }));

/* ------------------------------- analytics ------------------------------- */
app.get("/api/analytics", wrap((req, res) => {
  const totals = dbm.get(
    "SELECT COUNT(*) AS campaigns, COALESCE(SUM(total),0) AS recipients, COALESCE(SUM(sent),0) AS sent, COALESCE(SUM(failed),0) AS failed, COALESCE(SUM(opened),0) AS opened, COALESCE(SUM(clicked),0) AS clicked FROM campaigns"
  );
  const contacts = dbm.get("SELECT COUNT(*) AS n FROM contacts").n;
  const templates = dbm.get("SELECT COUNT(*) AS n FROM templates").n;
  // Sends per day from events.
  const perDay = dbm.all(
    "SELECT substr(at,1,10) AS day, type, COUNT(*) AS n FROM events WHERE type IN ('sent','failed','bounced') GROUP BY day, type ORDER BY day"
  );
  ok(res, { ...totals, contacts, templates, perDay });
}));

/* ------------------------------- tracking -------------------------------- */
const PIXEL = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
);

app.get("/track/open/:recipientId", wrap((req, res) => {
  const rid = Number(req.params.recipientId);
  const r = dbm.get("SELECT * FROM campaign_recipients WHERE id = ?", [rid]);
  if (r) {
    if (!r.opened_at) {
      dbm.run("UPDATE campaign_recipients SET opened_at = ? WHERE id = ?", [dbm.now(), rid]);
      dbm.run("UPDATE campaigns SET opened = opened + 1 WHERE id = ?", [r.campaign_id]);
    }
    dbm.run("INSERT INTO events (type, campaign_id, recipient_id, at, meta) VALUES (?,?,?,?,?)",
      ["open", r.campaign_id, rid, dbm.now(), JSON.stringify({})]);
  }
  res.setHeader("Content-Type", "image/png");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.send(PIXEL);
}));

app.get("/track/click/:recipientId/:token", wrap((req, res) => {
  const rid = Number(req.params.recipientId);
  let url = "";
  try { url = Buffer.from(req.params.token, "base64url").toString("utf8"); } catch { url = ""; }
  const r = dbm.get("SELECT * FROM campaign_recipients WHERE id = ?", [rid]);
  if (r) {
    if (!r.clicked_at) {
      dbm.run("UPDATE campaign_recipients SET clicked_at = ? WHERE id = ?", [dbm.now(), rid]);
      dbm.run("UPDATE campaigns SET clicked = clicked + 1 WHERE id = ?", [r.campaign_id]);
    }
    dbm.run("INSERT INTO events (type, campaign_id, recipient_id, at, meta) VALUES (?,?,?,?,?)",
      ["click", r.campaign_id, rid, dbm.now(), JSON.stringify({ url })]);
  }
  if (url && /^https?:\/\//i.test(url)) return res.redirect(302, url);
  res.status(400).send("Invalid link");
}));

/* -------------------------------- helpers -------------------------------- */
function safeParse(str, fallback) { try { return JSON.parse(str); } catch { return fallback; } }
function normalizeEmail(v) { return String(v || "").trim().toLowerCase(); }

function detectColumns(headers) {
  const norm = (h) => String(h).toLowerCase().replace(/[^a-z0-9]/g, "");
  const aliases = {
    email: ["email", "emailaddress", "mail", "eemail", "contactemail"],
    first_name: ["firstname", "first", "givenname", "fname"],
    last_name: ["lastname", "last", "surname", "familyname", "lname"],
    company: ["company", "organization", "organisation", "org", "business", "employer"],
    phone: ["phone", "phonenumber", "mobile", "telephone", "contactnumber", "cell"],
  };
  const map = { email: "", first_name: "", last_name: "", company: "", phone: "" };
  for (const h of headers) {
    const n = norm(h);
    for (const key of Object.keys(aliases)) {
      if (!map[key] && aliases[key].includes(n)) map[key] = h;
    }
  }
  // Fallback: if no email column matched, take the first header that looks like an email value.
  if (!map.email) {
    for (const h of headers) if (/mail/i.test(h)) { map.email = h; break; }
  }
  return map;
}

/* -------------------------------- startup -------------------------------- */
const PORT = Number(process.env.PORT) || 4099;
dbm.init().then(() => {
  app.listen(PORT, "127.0.0.1", () => {
    console.log(`RBG API listening on http://127.0.0.1:${PORT}`);
  });
});

module.exports = app;
