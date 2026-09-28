# RBG Lead Intelligence — project guide

Desktop email-campaign application: **Electron** shell + **Vite/React** client +
**Express** API + **SQLite** (via `sql.js`, WASM) + **Nodemailer** SMTP sending.

## Layout

- `electron/` — Electron main process. Loads the Vite dev server in dev, the built client in prod.
- `client/` — Vite + React + React Router + Axios + Chart.js UI.
- `server/` — Express API, SQLite persistence, Nodemailer sending engine, tracking.

## Dev

```bash
npm install
npm run dev
```

Starts, via `concurrently`:

- Express API on `http://127.0.0.1:4099`
- Vite client on `http://127.0.0.1:5173` (proxies `/api` and `/track` to the API)
- Electron desktop window pointed at the client

## Conventions

- The client never talks to `127.0.0.1:4099` directly; it uses relative `/api` + `/track`, proxied by Vite in dev.
- SMTP passwords are encrypted at rest with a locally generated key (`server/data/.key`). Never log or commit secrets.
- Sending is one-at-a-time with a randomized per-email delay, and supports pause/resume/stop.
- Open tracking is an estimate (clients may block or preload the pixel). The app does not attempt to bypass spam filters or deceive receivers.
