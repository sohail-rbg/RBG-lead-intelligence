import * as React from "react";
import { cn } from "@/lib/utils";

/** Lightweight avatar: initials on a coloured background. */
function Avatar({ className, name, color = "bg-zinc-500", size = "md" }) {
  const sizes = { xs: "h-5 w-5 text-[9px]", sm: "h-6 w-6 text-[10px]", md: "h-8 w-8 text-xs", lg: "h-10 w-10 text-sm" };
  const initials =
    name
      ?.split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";
  return (
    <span
      title={name}
      className={cn("inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white", sizes[size], color, className)}
    >
      {initials}
    </span>
  );
}

function AvatarGroup({ users = [], size = "sm", max = 4 }) {
  const shown = users.slice(0, max);
  const extra = users.length - shown.length;
  return (
    <span className="flex -space-x-1.5">
      {shown.map((u) => (
        <Avatar key={u.id} name={u.name} color={u.color} size={size} className="ring-2 ring-card" />
      ))}
      {extra > 0 && (
        <span className={cn("inline-flex items-center justify-center rounded-full bg-zinc-200 font-semibold text-zinc-600 ring-2 ring-card", size === "sm" ? "h-6 w-6 text-[10px]" : "h-8 w-8 text-xs")}>
          +{extra}
        </span>
      )}
    </span>
  );
}

export { Avatar, AvatarGroup };
