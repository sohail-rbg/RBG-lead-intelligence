import { SignIn } from "@clerk/nextjs";
import Link from "next/link";

export const metadata = { title: "Sign in" };

const clerkEnabled = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY
);

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white">
        R
      </span>
      <div>
        <p className="text-sm font-semibold leading-tight">RBG Delivery OS</p>
        <p className="text-[11px] text-muted-foreground">Client delivery platform</p>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-6">
      <Brand />
      {clerkEnabled ? (
        <SignIn routing="hash" />
      ) : (
        <div className="w-full max-w-md rounded-xl border bg-card p-6 text-center shadow-sm">
          <p className="font-semibold">Demo mode — no sign-in required</p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Clerk keys are not configured, so the app runs in demo mode. Enter through the main app and use the
            role switcher in the top-right to preview Admin, PM, Team Leader, Developer and Client roles.
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            Add <code className="rounded bg-muted px-1.5 py-0.5 font-mono">NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> and{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono">CLERK_SECRET_KEY</code> to <code className="font-mono">.env.local</code> to enable real sign-in.
          </p>
          <Link
            href="/"
            className="mt-5 inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            Continue to dashboard
          </Link>
        </div>
      )}
    </div>
  );
}
