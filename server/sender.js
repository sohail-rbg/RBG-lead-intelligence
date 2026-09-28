// Campaign sending engine.
// One email at a time, randomized delay between sends, supports pause/resume/stop,
// rewrites links for click tracking and injects an open-tracking pixel, with retry
// and bounce/failure handling. Runs in-process (no attempt to bypass spam filters).
const db = require("./db");
const mailer = require("./mailer");

const BASE = process.env.TRACK_BASE_URL || "http://127.0.0.1:4099";
const active = new Map(); // campaignId -> control

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitWhilePaused(control) {
  while (control.state === "paused" && !control.stopped) {
    await sleep(400);
  }
}

// Replace {{variable}} tokens with values from the contact (core + extra fields).
function render(tpl, contact) {
  const values = {
    first_name: contact.first_name || "",
    last_name: contact.last_name || "",
    email: contact.email || "",
    company: contact.company || "",
    phone: contact.phone || "",
    ...safeParse(contact.extra, {}),
  };
  return tpl.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) =>
    values[key] !== undefined ? String(values[key]) : ""
  );
}

function safeParse(str, fallback) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

// Rewrite http(s) links for click tracking and inject an open-tracking pixel.
function injectTracking(html, recipientId) {
  let out = String(html || "");
  out = out.replace(/href=["'](https?:\/\/[^"']+)["']/gi, (m, url) => {
    const token = Buffer.from(url, "utf8").toString("base64url");
    return `href="${BASE}/track/click/${recipientId}/${token}"`;
  });
  const pixel = `<img src="${BASE}/track/open/${recipientId}" width="1" height="1" alt="" style="display:none" />`;
  if (/<\/body>/i.test(out)) out = out.replace(/<\/body>/i, `${pixel}</body>`);
  else out += pixel;
  return out;
}

function collectVariables(template, contact) {
  const vars = safeParse(template.variables, []);
  return vars;
}

async function start(campaignId) {
  if (active.has(campaignId)) {
    throw new Error("Campaign is already running");
  }
  const campaign = db.get("SELECT * FROM campaigns WHERE id = ?", [campaignId]);
  if (!campaign) throw new Error("Campaign not found");
  const template = db.get("SELECT * FROM templates WHERE id = ?", [campaign.template_id]);
  if (!template) throw new Error("Template not found for campaign");
  const profile = db.get("SELECT * FROM smtp_profiles WHERE id = ?", [campaign.smtp_profile_id]);
  if (!profile) throw new Error("SMTP profile not found for campaign");

  const control = { state: "running", stopped: false };
  active.set(campaignId, control);

  db.run("UPDATE campaigns SET status = ?, started_at = ? WHERE id = ?", [
    "running",
    db.now(),
    campaignId,
  ]);
  db.run("INSERT INTO events (type, campaign_id, at, meta) VALUES (?,?,?,?)", [
    "campaign_started",
    campaignId,
    db.now(),
    JSON.stringify({}),
  ]);

  const recipients = db.all(
    "SELECT r.*, c.first_name, c.last_name, c.company, c.phone, c.extra FROM campaign_recipients r LEFT JOIN contacts c ON c.id = r.contact_id WHERE r.campaign_id = ? AND r.status = 'pending' ORDER BY r.id",
    [campaignId]
  );

  const delayMin = Number(campaign.delay_min) || 1000;
  const delayMax = Number(campaign.delay_max) || delayMin + 4000;

  for (let i = 0; i < recipients.length; i++) {
    const r = recipients[i];
    if (control.stopped) break;
    await waitWhilePaused(control);
    if (control.stopped) break;

    await sendOne({ campaign, template, profile, recipient: r, control });

    // Randomized delay between emails (skip after the last one).
    if (i < recipients.length - 1 && !control.stopped) {
      const delay = delayMin + Math.floor(Math.random() * Math.max(1, delayMax - delayMin));
      await sleep(delay);
    }
  }

  const remaining = db.get(
    "SELECT COUNT(*) AS n FROM campaign_recipients WHERE campaign_id = ? AND status = 'pending'",
    [campaignId]
  ).n;
  const finalStatus = control.stopped || remaining > 0 ? "stopped" : "completed";
  db.run("UPDATE campaigns SET status = ? WHERE id = ?", [finalStatus, campaignId]);
  db.run("INSERT INTO events (type, campaign_id, at, meta) VALUES (?,?,?,?)", [
    control.stopped ? "campaign_stopped" : "campaign_completed",
    campaignId,
    db.now(),
    JSON.stringify({ remaining }),
  ]);
  active.delete(campaignId);
}

async function sendOne({ campaign, template, profile, recipient, control }) {
  const contact = {
    first_name: recipient.first_name,
    last_name: recipient.last_name,
    company: recipient.company,
    phone: recipient.phone,
    extra: recipient.extra,
    email: recipient.email,
  };
  const subject = render(template.subject || "", contact);
  const text = render(template.text || "", contact) + signatureText(template);
  const html = injectTracking(render(template.html || "", contact), recipient.id) +
    (template.signature ? `<div>${template.signature}</div>` : "");

  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (control.stopped) return;
    db.run("UPDATE campaign_recipients SET attempts = ? WHERE id = ?", [attempt, recipient.id]);
    try {
      await mailer.send(profile, { to: recipient.email, subject, text, html });
      db.run("UPDATE campaign_recipients SET status = 'sent', sent_at = ?, error = '' WHERE id = ?", [
        db.now(),
        recipient.id,
      ]);
      db.run("UPDATE campaigns SET sent = sent + 1 WHERE id = ?", [campaign.id]);
      db.run("INSERT INTO events (type, campaign_id, recipient_id, at, meta) VALUES (?,?,?,?,?)", [
        "sent",
        campaign.id,
        recipient.id,
        db.now(),
        JSON.stringify({ attempts: attempt }),
      ]);
      return;
    } catch (err) {
      const permanent = isPermanentError(err);
      if (permanent || attempt === maxAttempts) {
        db.run("UPDATE campaign_recipients SET status = 'failed', error = ? WHERE id = ?", [
          String(err && err.message ? err.message : err).slice(0, 500),
          recipient.id,
        ]);
        db.run("UPDATE campaigns SET failed = failed + 1 WHERE id = ?", [campaign.id]);
        db.run("INSERT INTO events (type, campaign_id, recipient_id, at, meta) VALUES (?,?,?,?,?)", [
          permanent ? "bounced" : "failed",
          campaign.id,
          recipient.id,
          db.now(),
          JSON.stringify({ error: String(err && err.message ? err.message : err) }),
        ]);
        return;
      }
      // Transient failure: short backoff then retry.
      await sleep(1000 * attempt);
    }
  }
}

function signatureText(template) {
  if (!template.signature) return "";
  const plain = String(template.signature).replace(/<[^>]*>/g, "");
  return `\n\n--\n${plain}`;
}

// A 5xx SMTP rejection or explicit invalid-recipient is treated as permanent (bounce).
function isPermanentError(err) {
  const code = err && (err.responseCode || err.code);
  if (typeof code === "number" && code >= 500 && code < 600) return true;
  const msg = String((err && err.message) || "").toLowerCase();
  return /invalid recipient|no such user|mailbox unavailable|does not exist|550|553|501/.test(msg);
}

function pause(campaignId) {
  const control = active.get(campaignId);
  if (control) control.state = "paused";
}
function resume(campaignId) {
  const control = active.get(campaignId);
  if (control) control.state = "running";
}
function stop(campaignId) {
  const control = active.get(campaignId);
  if (control) {
    control.stopped = true;
    control.state = "stopped";
  }
}
function isRunning(campaignId) {
  return active.has(campaignId);
}
function stateOf(campaignId) {
  const control = active.get(campaignId);
  return control ? control.state : "idle";
}

module.exports = { start, pause, resume, stop, isRunning, stateOf };
