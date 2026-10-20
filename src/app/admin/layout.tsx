import { redirect } from "next/navigation";

import { AdminForbidden } from "@/components/admin/AdminForbidden";
import { AdminShell } from "@/components/admin/AdminShell";
import { getViewer } from "@/lib/auth/session";

/**
 * Admin shell.
 *
 * A signed-out visitor is sent to sign in. A signed-in NON-admin gets the
 * forbidden view rendered in place - not a redirect - because
 * `requireAdmin()` redirects to `/admin/forbidden`, which lives under this
 * same layout; redirecting again would loop.
 *
 * `isAdmin` here only decides what is rendered. It is a UI affordance, never
 * authorization: the API checks abilities, admin middleware and a Policy on
 * every single admin request, so a forged flag can at most reveal an empty
 * screen (contract 2.2, 8).
 */
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const viewer = await getViewer();

  if (!viewer) {
    redirect("/login?next=%2Fadmin");
  }

  if (!viewer.isAdmin) {
    return <AdminForbidden />;
  }

  return (
    <AdminShell viewerName={viewer.name} viewerEmail={viewer.email}>
      {children}
    </AdminShell>
  );
}
