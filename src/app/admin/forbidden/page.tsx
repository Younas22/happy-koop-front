import type { Metadata } from "next";

import { AdminForbidden } from "@/components/admin/AdminForbidden";
import { getRuntimeConfig } from "@/lib/runtime-config";
import { buildPageMetadata } from "@/lib/utils/seo";

export async function generateMetadata(): Promise<Metadata> {
  const config = await getRuntimeConfig();
  return buildPageMetadata(config, {
    title: "Admin access",
    canonicalPath: "/admin/forbidden",
    noindex: true,
  });
}

/**
 * The target `requireAdmin()` redirects to.
 *
 * It deliberately does NOT call `requireAdmin()` itself - that would redirect
 * here again - and it reads no admin data. An admin who lands here by mistake
 * sees it inside the normal admin shell; a non-admin sees the same message
 * from the layout.
 */
export default function AdminForbiddenPage() {
  return <AdminForbidden />;
}
