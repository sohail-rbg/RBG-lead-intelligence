import { NavLink, Outlet } from "react-router-dom";

const links = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/contacts", label: "Contacts" },
  { to: "/templates", label: "Templates" },
  { to: "/campaigns", label: "Campaigns" },
  { to: "/settings", label: "Settings" },
];

const titles = {
  "/": "Dashboard",
  "/contacts": "Contacts",
  "/templates": "Templates",
  "/campaigns": "Campaigns",
  "/settings": "Settings",
};

export default function Layout() {
  const path = window.location.hash.replace(/^#/, "") || "/";
  const title = titles[path] || "RBG Lead Intelligence";
  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          RBG <span>Lead Intelligence</span>
        </div>
        <nav className="nav">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end}>
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="foot">Local outreach workspace</div>
      </aside>
      <div className="main">
        <div className="topbar">
          <h1>{title}</h1>
          <span className="muted small">API 127.0.0.1:4099</span>
        </div>
        <div className="content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
