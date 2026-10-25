import type { Metadata } from "next";
import Link from "next/link";

import { AdminError, AdminPageHeader } from "@/components/admin/AdminParts";
import { StoreSettingsForm } from "@/components/admin/StoreSettingsForm";
import { Button } from "@/components/ui/Button";
import { fetchAllAdminMedia, fetchStoreSettings } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth/session";
import { getBootstrapOrigin, getRuntimeConfig } from "@/lib/runtime-config";
import { buildPageMetadata } from "@/lib/utils/seo";
import { parseAllowedHosts } from "@/lib/utils/url";

export async function generateMetadata(): Promise<Metadata> {
  const config = await getRuntimeConfig();
  return buildPageMetadata(config, {
    title: "Store settings",
    canonicalPath: "/admin/settings/store",
    noindex: true,
  });
}

export default async function AdminStoreSettingsPage() {
  await requireAdmin("/admin/settings/store");

  const [settings, media] = await Promise.all([
    fetchStoreSettings(),
    // The whole library, so the media picker can search it.
    fetchAllAdminMedia({ type: "image" }),
  ]);

  return (
    <>
      <AdminPageHeader
        title="Store settings"
        description="Branding, locale, public URLs, SEO defaults and feature toggles."
      />

      {settings.error || !settings.data ? (
        <AdminError
          error={settings.error!}
          action={
            <Button asChild variant="secondary">
              <Link href="/admin/settings/store">Try again</Link>
            </Button>
          }
        />
      ) : (
        <StoreSettingsForm
          settings={settings.data}
          media={media.data?.assets ?? []}
          mediaTotal={media.data?.total}
          mediaTruncated={media.data?.truncated}
          // Deployment-time values, shown so the admin can see what the
          // storefront will actually accept. Neither is editable here.
          allowedApiHosts={parseAllowedHosts(process.env.NEXT_PUBLIC_ALLOWED_API_HOSTS)}
          bootstrapUrl={getBootstrapOrigin()}
        />
      )}
    </>
  );
}
