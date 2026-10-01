import { redirect } from "next/navigation";
import { getSession } from "@/server/session";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";

export const dynamic = "force-dynamic";

/** Fully server-rendered shell: nav, badges and identity arrive in the HTML. */
export default async function AppLayout({ children }) {
  const session = await getSession();
  if (!session.user) redirect("/sign-in");

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar user={session.user} permissions={session.permissions} counts={session.counts} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar session={session} />
        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
