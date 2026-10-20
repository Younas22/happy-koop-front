import type { Metadata } from "next";
import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/AdminParts";
import { PageEditor } from "@/components/admin/PageEditor";
import { Button } from "@/components/ui/Button";
import { requireAdmin } from "@/lib/auth/session";
import { getRuntimeConfig } from "@/lib/runtime-config";
import { buildPageMetadata } from "@/lib/utils/seo";

export async function generateMetadata(): Promise<Metadata> {
  const config = await getRuntimeConfig();
  return buildPageMetadata(config, {
    title: "New page",
    canonicalPath: "/admin/pages/new",
    noindex: true,
  });
}

export default async function AdminNewPagePage() {
  await requireAdmin("/admin/pages/new");

  return (
    <>
      <AdminPageHeader
        title="New page"
        actions={
          <Button asChild variant="ghost">
            <Link href="/admin/pages">Cancel</Link>
          </Button>
        }
      />
      <PageEditor page={null} />
    </>
  );
}
