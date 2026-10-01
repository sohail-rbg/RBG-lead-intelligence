import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/** "2026-09-30" -> "30 Sep" (or with year if different from 2026) */
export function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso.length <= 10 ? `${iso}T00:00:00` : iso);
  const opts = { day: "numeric", month: "short" };
  if (d.getFullYear() !== 2026) opts.year = "numeric";
  return d.toLocaleDateString("en-IN", opts);
}

/** "2026-09-30 14:12" -> "30 Sep, 14:12" */
export function fmtDateTime(value) {
  if (!value) return "—";
  const [date, time] = String(value).split(" ");
  return time ? `${fmtDate(date)}, ${time}` : fmtDate(date);
}

export function daysUntil(iso) {
  const today = new Date("2026-09-30T00:00:00");
  const target = new Date(`${iso}T00:00:00`);
  return Math.round((target - today) / 86400000);
}

export function relativeDays(iso) {
  const d = daysUntil(iso);
  if (d === 0) return "today";
  if (d === 1) return "tomorrow";
  if (d === -1) return "yesterday";
  return d > 0 ? `in ${d} days` : `${-d} days overdue`;
}

/** Position (0-100) of a date within a range, clamped. */
export function pctBetween(dateIso, startIso, endIso) {
  const start = new Date(`${startIso}T00:00:00`).getTime();
  const end = new Date(`${endIso}T00:00:00`).getTime();
  const cur = new Date(`${dateIso}T00:00:00`).getTime();
  if (end === start) return 0;
  return Math.min(100, Math.max(0, ((cur - start) / (end - start)) * 100));
}

export function nowStamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
