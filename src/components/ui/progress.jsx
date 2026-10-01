import * as React from "react";
import { cn } from "@/lib/utils";

function Progress({ value = 0, className, indicatorClassName, size = "md" }) {
  const heights = { sm: "h-1.5", md: "h-2", lg: "h-2.5" };
  const tone =
    value >= 100 ? "bg-emerald-500" : value >= 66 ? "bg-emerald-500" : value >= 33 ? "bg-primary" : "bg-amber-500";
  return (
    <div className={cn("w-full overflow-hidden rounded-full bg-secondary", heights[size], className)}>
      <div
        className={cn("h-full rounded-full transition-all", indicatorClassName || tone)}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export { Progress };
