import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { TooltipProvider } from "@/components/ui/tooltip";

const clerkEnabled = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY
);

export const metadata = {
  title: {
    default: "RBG Delivery OS",
    template: "%s · RBG Delivery OS",
  },
  description:
    "Client delivery platform for RBG Digital — onboarding, projects, tasks, QC, page approvals, credentials vault and renewals.",
};

export default function RootLayout({ children }) {
  const tree = <TooltipProvider delayDuration={200}>{children}</TooltipProvider>;
  return (
    <html lang="en">
      <body className="h-full">
        {clerkEnabled ? (
          <ClerkProvider
            appearance={{
              variables: { colorPrimary: "#4f46e5", borderRadius: "10px" },
            }}
          >
            {tree}
          </ClerkProvider>
        ) : (
          tree
        )}
      </body>
    </html>
  );
}
