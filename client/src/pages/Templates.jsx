import { useEffect, useState } from "react";
import { get, post, put, del } from "../api.js";

const blank = { name: "", subject: "", html: "", text: "", signature: "", variables: "" };
const sample = { first_name: "Alex", last_name: "Lee", email: "alex@example.com", company: "Acme", phone: "555-0100" };

function previewHtml(html, signature) {
  let out = String(html || "").replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => sample[k] ?? `{{${k}}}`);
  if (signature) out += `<div>${signature}</div>`;
  return out;
}

export default function Templates() {
  const [templates, setTemplates] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);
  const [toast, setToast] = useState("");

  const load = async () => setTemplates(await get("/templates"));
  useEffect(() => { load().catch(() => {}); }, []);
  const say = (m) => { setToast(m); setTimeout(() => setToast(""), 2500); };

  function openNew() { setForm(blank); setEditing({ id: "new" }); }
  function openEdit(t) {
    setForm({ ...t, variables: (JSON.parse(t.variables || "[]") || []).join(", ") });
    setEditing(t);
  }
  async function save() {
    const payload = { ...form, variables: form.variables.split(",").map((v) => v.trim()).filter(Boolean) };
    if (editing.id === "new") await post("/templates", payload);
    else await put(`/templates/${editing.id}`, payload);
    setEditing(null);
    await load();
    say("Template saved");
  }
  async function remove(id) {
    if (!confirm("Delete this template?")) return;
    await del(`/templates/${id}`);
    if (editing && editing.id === id) setEditing(null);
    await load();
    say("Deleted");
  }

  return (
    <div className="two-col" style={{ alignItems: "start" }}>
      <div>
        <div className="row mb">
          <button className="btn primary" onClick={openNew}>+ New template</button>
        </div>
        <div className="card" style={{ padding: 0 }}>
          <table>
            <thead><tr><th>Name</th><th>Subject</th><th></th></tr></thead>
            <tbody>
              {templates.map((t) => (
                <tr key={t.id} style={{ cursor: "pointer", background: editing?.id === t.id ? "var(--panel-2)" : undefined }}>
                  <td onClick={() => openEdit(t)}>{t.name}</td>
                  <td onClick={() => openEdit(t)} className="muted">{t.subject}</td>
                  <td style={{ textAlign: "right" }}><button className="btn sm danger" onClick={() => remove(t.id)}>Delete</button></td>
                </tr>
              ))}
              {!templates.length && <tr><td colSpan="3" className="empty">No templates yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        {editing ? (
          <div className="card">
            <label className="field"><span>Name</span><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
            <label className="field"><span>Subject</span><input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></label>
            <label className="field"><span>HTML body ({"{{first_name}}"}, {"{{company}}"}, …)</span>
              <textarea style={{ minHeight: 120 }} value={form.html} onChange={(e) => setForm({ ...form, html: e.target.value })} /></label>
            <label className="field"><span>Plain text</span>
              <textarea value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} /></label>
            <label className="field"><span>Signature (HTML)</span>
              <input value={form.signature} onChange={(e) => setForm({ ...form, signature: e.target.value })} /></label>
            <label className="field"><span>Variables (comma separated)</span>
              <input value={form.variables} onChange={(e) => setForm({ ...form, variables: e.target.value })} /></label>
            <div className="row" style={{ justifyContent: "flex-end" }}>
              <button className="btn" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn primary" onClick={save}>Save template</button>
            </div>
          </div>
        ) : (
          <div className="card empty">Select a template or create a new one.</div>
        )}

        {editing && (
          <div className="card mt">
            <div className="label muted small" style={{ marginBottom: 8 }}>PREVIEW</div>
            <div className="preview" dangerouslySetInnerHTML={{ __html: previewHtml(form.html, form.signature) }} />
          </div>
        )}
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
