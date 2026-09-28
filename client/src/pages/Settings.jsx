import { useCallback, useEffect, useState } from "react";
import { get, post, put, del } from "../api.js";

const blank = { name: "", host: "", port: 587, secure: false, user: "", password: "", from_name: "", from_email: "" };

export default function Settings() {
  const [profiles, setProfiles] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);
  const [toast, setToast] = useState("");
  const [testing, setTesting] = useState(null);

  const load = useCallback(async () => setProfiles(await get("/smtp-profiles")), []);
  useEffect(() => { load().catch(() => {}); }, [load]);
  const say = (m) => { setToast(m); setTimeout(() => setToast(""), 3000); };

  function openNew() { setForm(blank); setEditing({ id: "new" }); }
  function openEdit(p) {
    setForm({ ...p, password: "" }); // never send the encrypted password back
    setEditing(p);
  }
  async function save() {
    if (editing.id === "new") {
      if (!form.password) return say("Password is required for a new profile");
      await post("/smtp-profiles", form);
    } else {
      await put(`/smtp-profiles/${editing.id}`, form); // password optional on edit
    }
    setEditing(null);
    await load();
    say("Profile saved");
  }
  async function remove(id) {
    if (!confirm("Delete this SMTP profile?")) return;
    await del(`/smtp-profiles/${id}`);
    await load();
    say("Deleted");
  }
  async function test(id) {
    setTesting(id);
    try {
      const res = await post(`/smtp-profiles/${id}/test`, {});
      say(res.message || "Connection OK");
    } catch (err) {
      say("Test failed: " + (err.response?.data?.error || err.message));
    } finally {
      setTesting(null);
    }
  }

  return (
    <div>
      <div className="row mb">
        <h3 style={{ margin: 0 }}>SMTP profiles</h3>
        <div className="spacer" />
        <button className="btn primary" onClick={openNew}>+ Add profile</button>
      </div>
      <div className="muted small mb">Passwords are encrypted at rest with a locally generated key and never leave this machine.</div>

      <div className="card" style={{ padding: 0 }}>
        <table>
          <thead><tr><th>Name</th><th>Host</th><th>Port</th><th>Secure</th><th>User</th><th>From</th><th></th></tr></thead>
          <tbody>
            {profiles.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{p.host}</td>
                <td>{p.port}</td>
                <td>{Number(p.secure) ? "Yes" : "No"}</td>
                <td>{p.user}</td>
                <td>{p.from_email || p.user}</td>
                <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                  <button className="btn sm" onClick={() => test(p.id)} disabled={testing === p.id}>{testing === p.id ? "Testing…" : "Test"}</button>{" "}
                  <button className="btn sm" onClick={() => openEdit(p)}>Edit</button>{" "}
                  <button className="btn sm danger" onClick={() => remove(p.id)}>Delete</button>
                </td>
              </tr>
            ))}
            {!profiles.length && <tr><td colSpan="7" className="empty">No SMTP profiles yet — add one to start sending.</td></tr>}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="modal-backdrop" onClick={() => setEditing(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editing.id === "new" ? "Add SMTP profile" : "Edit SMTP profile"}</h3>
            <label className="field"><span>Name</span><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
            <div className="two-col">
              <label className="field"><span>Host</span><input value={form.host} onChange={(e) => setForm({ ...form, host: e.target.value })} /></label>
              <label className="field"><span>Port</span><input type="number" value={form.port} onChange={(e) => setForm({ ...form, port: e.target.value })} /></label>
            </div>
            <div className="two-col">
              <label className="field"><span>Username</span><input value={form.user} onChange={(e) => setForm({ ...form, user: e.target.value })} /></label>
              <label className="field"><span>Password {editing.id !== "new" && <em className="muted">(leave blank to keep)</em>}</span><input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
            </div>
            <div className="two-col">
              <label className="field"><span>From name</span><input value={form.from_name} onChange={(e) => setForm({ ...form, from_name: e.target.value })} /></label>
              <label className="field"><span>From email</span><input value={form.from_email} onChange={(e) => setForm({ ...form, from_email: e.target.value })} /></label>
            </div>
            <label className="field"><span><input type="checkbox" checked={!!form.secure} onChange={(e) => setForm({ ...form, secure: e.target.checked })} style={{ width: "auto", marginRight: 8 }} />Use TLS/SSL (secure)</span></label>
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
