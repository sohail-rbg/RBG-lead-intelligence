import { useEffect, useState } from "react";
import { get } from "../api.js";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function Stat({ label, value, color }) {
  return (
    <div className="card stat">
      <div className="label">{label}</div>
      <div className="value" style={color ? { color } : undefined}>{value}</div>
    </div>
  );
}

export default function Dashboard() {
  const [a, setA] = useState(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    get("/analytics").then(setA).catch((e) => setErr(e.message));
  }, []);

  if (err) return <div className="empty">Could not reach the API. Is the server running?<div className="small mt">{err}</div></div>;
  if (!a) return <div className="empty">Loading…</div>;

  const days = [...new Set(a.perDay.map((d) => d.day))].sort();
  const sent = days.map((day) =>
    a.perDay.filter((d) => d.day === day && d.type === "sent").reduce((s, d) => s + d.n, 0)
  );
  const failed = days.map((day) =>
    a.perDay.filter((d) => d.day === day && (d.type === "failed" || d.type === "bounced")).reduce((s, d) => s + d.n, 0)
  );
  const chart = {
    labels: days.length ? days : ["no data"],
    datasets: [
      { label: "Sent", data: sent, backgroundColor: "#3d6ae0" },
      { label: "Failed / bounced", data: failed, backgroundColor: "#ef5f5f" },
    ],
  };

  const openRate = a.sent ? Math.round((a.opened / a.sent) * 100) : 0;
  const clickRate = a.sent ? Math.round((a.clicked / a.sent) * 100) : 0;

  return (
    <div className="grid">
      <div className="grid stats">
        <Stat label="Campaigns" value={a.campaigns} />
        <Stat label="Contacts" value={a.contacts} />
        <Stat label="Templates" value={a.templates} />
        <Stat label="Sent" value={a.sent} color="var(--green)" />
        <Stat label="Failed" value={a.failed} color="var(--red)" />
        <Stat label="Opens" value={`${openRate}%`} color="var(--amber)" />
        <Stat label="Clicks" value={`${clickRate}%`} color="var(--accent)" />
      </div>
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Sending activity</h3>
        <Bar data={chart} options={{ responsive: true, plugins: { legend: { labels: { color: "#8b93a7" } } }, scales: { x: { ticks: { color: "#8b93a7" } }, y: { ticks: { color: "#8b93a7" }, beginAtZero: true } } }} />
        <div className="muted small mt">Open tracking is an estimate — clients may block or preload the tracking pixel.</div>
      </div>
    </div>
  );
}
