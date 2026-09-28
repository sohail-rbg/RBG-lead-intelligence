import { useCallback, useEffect, useState } from "react";
import { get, post } from "../api.js";

const blank = { name: "", template_id: "", smtp_profile_id: "", delay_min: 2000, delay_max: 8000, contact_ids: "" };

function StatusBadge({ c }) {
  if (c.running && c.state === "paused") return <span className="badge amber">Paused</span>;
  if (c.running) return <span className="badge blue">Running</span>;
  if (c.status === "completed") return <span className="badge green">Completed</span>;
  if (c.status === "stopped") return <span className="badge amber">Stopped</span>;
  return <span className="badge gray">Draft</span>;
}

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [form, setForm] = useState(blank);
  const [toast, setToast] = useState("");
  const [recipients, setRecipients] = useState(null);

  const load = useCallback(async () => {
    setCampaigns(await get("/campaigns"));
  }, []);
  useEffect(() => {
    load().catch(() => {});
    get("/templates").then(setTemplates).catch(() => {});
    get("/smtp-profiles").then(setProfiles).catch(() => {});
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
  }, [load]);

  const say = (m) => { setToast(m); setTimeout(() => setToast(""), 2500); };

  async function create() {
    if (!form.name || !form.template_id || !form.smtp_profile_id) return say("Name, template and SMTP profile are required");
    const payload = {
      name: form.name,
      template_id: Number(form.template_id),
      smtp_profile_id: Number(form.smtp_profile_id),
      delay_min: Number(form.delay_min),
      delay_max: Number(form.delay_max),
      contact_ids: form.contact_ids ? form.contact_ids.split(",").map((s) => Number(s.trim())).filter(Boolean) : undefined,
    };
    const res = await post("/campaigns", payload);
    say(`Campaign created with ${res.total} recipients`);
    setForm(blank);
    await load();
  }

  async function act(id, action) {
    await post(`/campaigns/${id}/${action}`, {});
    say(action);
    await load();
  }

  async function viewRecipients(id) {
    setRecipients({ id, rows: await get(`/campaigns/${id}/recipients`) });
  }

  return (
    <div>
      <div className="card mb">
        <h3 style={{ marginTop: 0 }}>New campaign</h3>
        <div className="two-col">
          <label className="field"><span>Name</span><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
          <label className="field"><span>Template</span>
            <select value={form.template_id} onChange={(e) => setForm({ ...form, template_id: e.target.value })}>
              <option value="">Select template…</option>
              {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select></label>
          <label className="field"><span>SMTP profile</span>
            <select value={form.smtp_profile_id} onChange={(e) => setForm({ ...form, smtp_profile_id: e.target.value })}>
              <option value="">Select profile…</option>
              {profiles.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.user})</option>)}
            </select></label>
          <label className="field"><span>Contact IDs (optional, blank = all active)</span><input value={form.contact_ids} onChange={(e) => setForm({ ...form, contact_ids: e.target.value })} placeholder="e.g. 1, 4, 7" /></label>
          <label className="field"><span>Delay min (ms)</span><input type="number" value={form.delay_min} onChange={(e) => setForm({ ...form, delay_min: e.target.value })} /></label>
          <label className="field"><span>Delay max (ms)</span><input type="number" value={form.delay_max} onChange={(e) => setForm({ ...form, delay_max: e.target.value })} /></label>
        </div>
        <div className="row" style={{ justifyContent: "flex-end" }}>
          <button className="btn primary" onClick={create}>Create campaign</button>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <table>
          <thead><tr><th>Name</th><th>Status</th><th>Recipients</th><th>Sent</th><th>Failed</th><th>Opens</th><th>Clicks</th><th></th></tr></thead>
          <tbody>
            {campaigns.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td><StatusBadge c={c} /></td>
                <td>{c.total}</td>
                <td>{c.sent}</td>
                <td>{c.failed}</td>
                <td>{c.opened}</td>
                <td>{c.clicked}</td>
                <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                  {!c.running && <button className="btn sm primary" onClick={() => act(c.id, "start")}>Start</button>}
                  {c.running && c.state !== "paused" && <button className="btn sm" onClick={() => act(c.id, "pause")}>Pause</button>}
                  {c.running && c.state === "paused" && <button className="btn sm" onClick={() => act(c.id, "resume")}>Resume</button>}
                  {c.running && <button className="btn sm danger" onClick={() => act(c.id, "stop")}>Stop</button>}
                  {" "}<button className="btn sm" onClick={() => viewRecipients(c.id)}>View</button>
                </td>
              </tr>
            ))}
            {!campaigns.length && <tr><td colSpan="8" className="empty">No campaigns yet.</td></tr>}
          </tbody>
        </table>
      </div>

      {recipients && (
        <div className="modal-backdrop" onClick={() => setRecipients(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Recipients</h3>
            <table>
              <thead><tr><th>Email</th><th>Status</th><th>Attempts</th><th>Error</th></tr></thead>
              <tbody>
                {recipients.rows.map((r) => (
                  <tr key={r.id}>
                    <td>{r.email}</td>
                    <td><span className={`badge ${r.status === "sent" ? "green" : r.status === "failed" ? "red" : "gray"}`}>{r.status}</span></td>
                    <td>{r.attempts}</td>
                    <td className="muted small">{r.error}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="row" style={{ justifyContent: "flex-end", marginTop: 16 }}>
              <button className="btn" onClick={() => setRecipients(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
