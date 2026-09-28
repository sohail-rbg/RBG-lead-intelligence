import { useCallback, useEffect, useState } from "react";
import { get, post, put, del } from "../api.js";

function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    if (/\.(xlsx|xls)$/i.test(file.name)) reader.readAsDataURL(file);
    else reader.readAsText(file);
  });
}

const blank = { email: "", first_name: "", last_name: "", company: "", phone: "", group_name: "", tags: "" };

export default function Contacts() {
  const [contacts, setContacts] = useState([]);
  const [q, setQ] = useState("");
  const [group, setGroup] = useState("");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (group) params.set("group", group);
    const data = await get(`/contacts?${params.toString()}`);
    setContacts(data);
  }, [q, group]);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  const say = (m) => { setToast(m); setTimeout(() => setToast(""), 2500); };

  async function onImport(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setLoading(true);
    try {
      const result = await readFile(file);
      const content = /\.(xlsx|xls)$/i.test(file.name) ? String(result).split(",")[1] : String(result);
      const res = await post("/contacts/import", { filename: file.name, content });
      say(`Imported ${res.imported}, skipped ${res.duplicates} duplicates, ${res.invalid} invalid`);
      await load();
    } catch (err) {
      say("Import failed: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  }

  async function onDedupe() {
    const res = await post("/contacts/dedupe", {});
    say(res.removedGroups ? `Removed ${res.removedGroups} duplicate group(s)` : "No duplicates found");
    await load();
  }

  function openNew() { setForm(blank); setEditing({ id: "new" }); }
  function openEdit(c) {
    setForm({ ...c, tags: (JSON.parse(c.tags || "[]") || []).join(", ") });
    setEditing(c);
  }
  async function save() {
    const payload = {
      ...form,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
    };
    if (editing.id === "new") await post("/contacts", payload);
    else await put(`/contacts/${editing.id}`, payload);
    setEditing(null);
    await load();
    say("Saved");
  }
  async function remove(id) {
    if (!confirm("Delete this contact?")) return;
    await del(`/contacts/${id}`);
    await load();
    say("Deleted");
  }

  const groups = [...new Set(contacts.map((c) => c.group_name).filter(Boolean))];

  return (
    <div>
      <div className="row mb">
        <input placeholder="Search email, name, company…" value={q} onChange={(e) => setQ(e.target.value)} style={{ maxWidth: 280 }} />
        <select value={group} onChange={(e) => setGroup(e.target.value)} style={{ maxWidth: 160 }}>
          <option value="">All groups</option>
          {groups.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
        <div className="spacer" />
        <label className="btn" style={{ cursor: "pointer" }}>
          {loading ? "Importing…" : "Import CSV/XLSX"}
          <input type="file" accept=".csv,.xlsx,.xls" onChange={onImport} style={{ display: "none" }} />
        </label>
        <button className="btn" onClick={onDedupe}>Dedupe</button>
        <a className="btn" href="/api/contacts/export" download>Export CSV</a>
        <button className="btn primary" onClick={openNew}>+ Add contact</button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <table>
          <thead>
            <tr><th>Email</th><th>Name</th><th>Company</th><th>Group</th><th>Tags</th><th></th></tr>
          </thead>
          <tbody>
            {contacts.map((c) => (
              <tr key={c.id}>
                <td>{c.email}</td>
                <td>{[c.first_name, c.last_name].filter(Boolean).join(" ")}</td>
                <td>{c.company}</td>
                <td>{c.group_name || <span className="muted">—</span>}</td>
                <td>{(JSON.parse(c.tags || "[]") || []).map((t) => <span key={t} className="badge blue" style={{ marginRight: 4 }}>{t}</span>)}</td>
                <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                  <button className="btn sm" onClick={() => openEdit(c)}>Edit</button>{" "}
                  <button className="btn sm danger" onClick={() => remove(c.id)}>Delete</button>
                </td>
              </tr>
            ))}
            {!contacts.length && <tr><td colSpan="6" className="empty">No contacts yet — import a CSV or add one.</td></tr>}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="modal-backdrop" onClick={() => setEditing(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editing.id === "new" ? "Add contact" : "Edit contact"}</h3>
            <label className="field"><span>Email</span><input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} disabled={editing.id !== "new"} /></label>
            <div className="two-col">
              <label className="field"><span>First name</span><input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} /></label>
              <label className="field"><span>Last name</span><input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} /></label>
            </div>
            <div className="two-col">
              <label className="field"><span>Company</span><input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /></label>
              <label className="field"><span>Phone</span><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
            </div>
            <div className="two-col">
              <label className="field"><span>Group</span><input value={form.group_name} onChange={(e) => setForm({ ...form, group_name: e.target.value })} /></label>
              <label className="field"><span>Tags (comma separated)</span><input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} /></label>
            </div>
            <div className="row" style={{ justifyContent: "flex-end" }}>
              <button className="btn" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn primary" onClick={save}>Save</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
