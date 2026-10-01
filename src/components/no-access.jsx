import { Lock } from "lucide-react";
import { ROLE_LABELS } from "@/lib/roles";

/** Server-safe "no permission" panel. */
export function NoAccess({ role, feature }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-card px-6 py-20 text-center">
      <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-rose-50 text-rose-600">
        <Lock className="h-5 w-5" />
      </span>
      <p className="font-semibold">No access</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Your role{role ? ` (${ROLE_LABELS[role]})` : ""} does not include permission for {feature || "this area"}. Ask an admin if you need access.
      </p>
    </div>
  );
}
