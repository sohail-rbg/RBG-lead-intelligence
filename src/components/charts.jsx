"use client";

import { cn } from "@/lib/utils";

export const CHART_PALETTE = [
  "#6366f1", // indigo
  "#10b981", // emerald
  "#f59e0b", // amber
  "#f43f5e", // rose
  "#8b5cf6", // violet
  "#0ea5e9", // sky
  "#a1a1aa", // zinc
];

/** Circular progress ring. `value` 0-100. */
export function Ring({ value = 0, size = 72, stroke = 8, className, trackClass = "stroke-zinc-200", barClass = "stroke-indigo-500", children }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(100, Math.max(0, value)) / 100);
  return (
    <span className={cn("relative inline-flex items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="ring-animated -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className={trackClass} />
        <circle
          data-progress
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ "--ring-circ": circ }}
          className={cn("transition-[stroke-dashoffset] duration-700", barClass)}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center">{children}</span>
    </span>
  );
}

/** Semi-circle gauge with a score. */
export function Gauge({ value = 0, size = 180, label, sub, tone }) {
  const stroke = 14;
  const r = (size - stroke) / 2;
  const half = Math.PI * r;
  const clamped = Math.min(100, Math.max(0, value));
  const offset = half * (1 - clamped / 100);
  const color = tone || (clamped >= 75 ? "#10b981" : clamped >= 50 ? "#f59e0b" : "#f43f5e");
  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size / 2 + 16} viewBox={`0 0 ${size} ${size / 2 + 16}`}>
        <path
          d={`M ${stroke / 2} ${size / 2} A ${r} ${r} 0 0 1 ${size - stroke / 2} ${size / 2}`}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          className="stroke-zinc-200"
        />
        <path
          d={`M ${stroke / 2} ${size / 2} A ${r} ${r} 0 0 1 ${size - stroke / 2} ${size / 2}`}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          stroke={color}
          strokeDasharray={half}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.9s cubic-bezier(0.22,1,0.36,1)" }}
        />
        <text x={size / 2} y={size / 2 - 8} textAnchor="middle" className="fill-foreground text-3xl font-bold">
          {Math.round(clamped)}
        </text>
        <text x={size / 2} y={size / 2 + 12} textAnchor="middle" className="fill-muted-foreground text-[11px]">
          {label}
        </text>
      </svg>
      {sub && <p className="-mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

/** Donut chart. segments: [{ label, value, color }] */
export function Donut({ segments, size = 168, thickness = 20, centerLabel, centerSub }) {
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  const r = (size - thickness) / 2;
  const circ = 2 * Math.PI * r;
  const offsets = (() => {
    const out = [];
    let acc = 0;
    for (const s of segments) {
      out.push(acc);
      acc += s.value;
    }
    return out;
  })();
  return (
    <div className="flex items-center gap-5">
      <span className="relative inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={thickness} className="stroke-zinc-100" />
          {segments.map((s, i) => {
            if (!s.value) return null;
            const frac = s.value / total;
            const dash = `${frac * circ} ${circ}`;
            const rotate = (offsets[i] / total) * 360;
            return (
              <circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth={thickness}
                strokeDasharray={dash}
                strokeLinecap="butt"
                transform={`rotate(${rotate} ${size / 2} ${size / 2})`}
                style={{ transition: "stroke-dasharray 0.7s ease" }}
              />
            );
          })}
        </svg>
        <span className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold leading-none">{centerLabel}</span>
          {centerSub && <span className="mt-1 text-[11px] text-muted-foreground">{centerSub}</span>}
        </span>
      </span>
      <ul className="space-y-1.5 text-sm">
        {segments.map((s, i) => (
          <li key={i} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
            <span className="text-muted-foreground">{s.label}</span>
            <span className="ml-auto pl-3 font-semibold">{s.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Vertical bars. data: [{ label, value, color?, hint? }] */
export function Bars({ data, height = 170, formatValue = (v) => v, barClass = "bg-indigo-500" }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="bar-animated flex items-end gap-3" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="group flex h-full flex-1 flex-col items-center justify-end gap-1.5" title={d.hint}>
          <span className="text-[11px] font-semibold text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
            {formatValue(d.value)}
          </span>
          <div
            data-bar
            className={cn("w-full max-w-10 rounded-t-md transition-all group-hover:opacity-80", barClass)}
            style={{ height: `${Math.max((d.value / max) * 100, 2)}%`, background: d.color, animationDelay: `${i * 60}ms` }}
          />
          <span className="max-w-full truncate text-[11px] text-muted-foreground">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

/** Area trend line. points: number[] */
export function AreaTrend({ points, height = 90, stroke = "#6366f1", id = "trend" }) {
  if (!points?.length) return null;
  const w = 260;
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const span = max - min || 1;
  const step = w / Math.max(points.length - 1, 1);
  const coords = points.map((p, i) => [i * step, height - 10 - ((p - min) / span) * (height - 24)]);
  const line = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${w},${height} L0,${height} Z`;
  const last = coords[coords.length - 1];
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="h-full w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`grad-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.28" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#grad-${id})`} />
      <path d={line} fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r="3.5" fill={stroke} />
      <circle cx={last[0]} cy={last[1]} r="7" fill={stroke} opacity="0.18" className="pulse-soft" />
    </svg>
  );
}

/** Segmented horizontal funnel bar. segments: [{label, value, color}] */
export function FunnelBar({ segments, className }) {
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  return (
    <div className={className}>
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-secondary">
        {segments.map((s, i) =>
          s.value ? (
            <div
              key={i}
              title={`${s.label}: ${s.value}`}
              className="h-full transition-all duration-700"
              style={{ width: `${(s.value / total) * 100}%`, background: s.color }}
            />
          ) : null
        )}
      </div>
      <div className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1.5 text-xs">
        {segments.map((s, i) => (
          <span key={i} className="flex items-center gap-1.5 text-muted-foreground">
            <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
            {s.label} <span className="font-semibold text-foreground">{s.value}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/** Activity heatmap — last `weeks` weeks, 7 rows. days: [{date, count}] */
export function Heatmap({ days, weeks = 16 }) {
  const cols = [];
  const totalDays = weeks * 7;
  const byDate = Object.fromEntries(days.map((d) => [d.date, d.count]));
  const max = Math.max(...days.map((d) => d.count), 1);
  const today = new Date("2026-09-30T00:00:00");
  for (let i = totalDays - 1; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 86400000);
    const iso = d.toISOString().slice(0, 10);
    cols.push({ iso, count: byDate[iso] || 0 });
  }
  const tone = (c) =>
    c === 0 ? "bg-zinc-100" : c / max < 0.34 ? "bg-indigo-200" : c / max < 0.67 ? "bg-indigo-400" : "bg-indigo-600";
  return (
    <div>
      <div className="grid grid-flow-col gap-1" style={{ gridTemplateRows: "repeat(7, 1fr)" }}>
        {cols.map((c) => (
          <span key={c.iso} title={`${c.iso} · ${c.count} events`} className={cn("h-3 w-3 rounded-[3px]", tone(c.count))} />
        ))}
      </div>
      <div className="mt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground">
        Less
        <span className="h-2.5 w-2.5 rounded-[3px] bg-zinc-100" />
        <span className="h-2.5 w-2.5 rounded-[3px] bg-indigo-200" />
        <span className="h-2.5 w-2.5 rounded-[3px] bg-indigo-400" />
        <span className="h-2.5 w-2.5 rounded-[3px] bg-indigo-600" />
        More
      </div>
    </div>
  );
}
