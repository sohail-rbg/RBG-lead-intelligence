"use client";

import { UserButton, useUser } from "@clerk/nextjs";

/** Isolated so useUser() only mounts when ClerkProvider is present. */
export function ClerkUserButton() {
  const { isLoaded } = useUser();
  if (!isLoaded) return <span className="h-8 w-8 animate-pulse rounded-full bg-secondary" />;
  return <UserButton afterSignOutUrl="/sign-in" />;
}
