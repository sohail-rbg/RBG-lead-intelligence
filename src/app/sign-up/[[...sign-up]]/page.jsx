import { SignUp } from "@clerk/nextjs";
import Link from "next/link";

export const metadata = { title: "Sign up" };

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

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-6">
      <Brand />
      {clerkEnabled ? (
        <SignUp routing="hash" />
      ) : (
        <div className="w-full max-w-md rounded-xl border bg-card p-6 text-center shadow-sm">
          <p className="font-semibold">Demo mode — sign-up unavailable</p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Clerk keys are not configured, so accounts are managed by the demo user list. Add your Clerk keys to
            enable self-service sign-up.
          </p>
          <Link
            href="/sign-in"
            className="mt-5 inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            Back to sign in
          </Link>
        </div>
      )}
    </div>
  );
}
