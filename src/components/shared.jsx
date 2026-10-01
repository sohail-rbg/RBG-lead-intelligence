import { cn } from "@/lib/utils";
import { statusMeta } from "@/lib/data";
import { Badge } from "@/components/ui/badge";

/** Page heading with title, description and action slot. */
export function PageHeader({ title, description, children, className }) {
  return (
    <div className={cn("mb-6 flex flex-wrap items-end justify-between gap-4", className)}>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

/** Stat card for dashboards. */
export function StatCard({ label, value, sub, icon: Icon, tone = "default" }) {
  const tones = {
    default: "bg-secondary text-foreground",
    primary: "bg-indigo-50 text-indigo-600",
    success: "bg-emerald-50 text-emerald-600",
    warning: "bg-amber-50 text-amber-600",
    danger: "bg-rose-50 text-rose-600",
  };
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1.5 text-2xl font-semibold tracking-tight">{value}</p>
          {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
        </div>
        {Icon && (
          <span className={cn("flex h-9 w-9 items-center justify-center rounded-lg", tones[tone])}>
            <Icon className="h-4.5 w-4.5" />
          </span>
        )}
      </div>
    </div>
  );
}

/** Status badge driven by the shared statusMeta map. */
export function StatusBadge({ status, className }) {
  const meta = statusMeta[status] || { label: status, className: "bg-zinc-100 text-zinc-600 border-zinc-200" };
  return (
    <Badge variant="outline" className={cn(meta.className, "capitalize", className)}>
      {meta.label}
    </Badge>
  );
}

/** Small dot indicator for health. */
export function HealthDot({ health = "green" }) {
  const colors = { green: "bg-emerald-500", amber: "bg-amber-500", red: "bg-rose-500" };
  return <span className={cn("inline-block h-2 w-2 rounded-full", colors[health] || colors.green)} />;
}

/** Priority chip. */
export function PriorityBadge({ priority }) {
  const map = {
    high: "bg-rose-50 text-rose-700 border-rose-200",
    medium: "bg-amber-50 text-amber-700 border-amber-200",
    low: "bg-zinc-100 text-zinc-600 border-zinc-200",
  };
  return (
    <Badge variant="outline" className={cn(map[priority] || map.low, "capitalize")}>
      {priority}
    </Badge>
  );
}

/** Empty state placeholder. */
export function EmptyState({ icon: Icon, title, description, children }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-card/50 px-6 py-12 text-center">
      {Icon && (
        <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-muted-foreground">
          <Icon className="h-5 w-5" />
        </span>
      )}
      <p className="font-medium">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
