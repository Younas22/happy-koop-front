import type { Metadata } from "next";
import Link from "next/link";

import { AdminError, AdminPageHeader } from "@/components/admin/AdminParts";
import { NavigationEditor } from "@/components/admin/NavigationEditor";
import { Button } from "@/components/ui/Button";
import { fetchStoreSettings } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth/session";
import { getRuntimeConfig } from "@/lib/runtime-config";
import { buildPageMetadata } from "@/lib/utils/seo";

export async function generateMetadata(): Promise<Metadata> {
  const config = await getRuntimeConfig();
  return buildPageMetadata(config, {
    title: "Navigation",
    canonicalPath: "/admin/settings/navigation",
    noindex: true,
  });
}

export default async function AdminNavigationPage() {
  await requireAdmin("/admin/settings/navigation");

  const { data, error } = await fetchStoreSettings();

  return (
    <>
      <AdminPageHeader
        title="Navigation"
        description="The links in the storefront header and footer."
      />

      {error || !data ? (
        <AdminError
          error={error!}
          action={
            <Button asChild variant="secondary">
              <Link href="/admin/settings/navigation">Try again</Link>
            </Button>
          }
        />
      ) : (
        <NavigationEditor navigation={data.navigation} />
      )}
    </>
  );
}
