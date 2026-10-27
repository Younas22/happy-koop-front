import type { Metadata } from "next";
import Link from "next/link";

import { AdminError, AdminPageHeader } from "@/components/admin/AdminParts";
import { MailSettingsForm } from "@/components/admin/MailSettingsForm";
import { Button } from "@/components/ui/Button";
import { fetchMailSettings } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth/session";
import { getRuntimeConfig } from "@/lib/runtime-config";
import { buildPageMetadata } from "@/lib/utils/seo";

export async function generateMetadata(): Promise<Metadata> {
  const config = await getRuntimeConfig();
  return buildPageMetadata(config, {
    title: "Email settings",
    canonicalPath: "/admin/settings/email",
    noindex: true,
  });
}

/**
 * Email settings.
 *
 * The API returns status only - the Resend key is reported as
 * `{configured, maskedSuffix, updatedAt}` - so no secret reaches the browser.
 */
export default async function AdminMailSettingsPage() {
  await requireAdmin("/admin/settings/email");
  const { data, error } = await fetchMailSettings();

  return (
    <>
      <AdminPageHeader
        title="Email settings"
        description="The sender for order and contact emails. Saved here, no .env edit needed."
      />

      {error || !data ? (
        <AdminError
          error={error!}
          action={
            <Button asChild variant="secondary">
              <Link href="/admin/settings/email">Try again</Link>
            </Button>
          }
        />
      ) : (
        <MailSettingsForm settings={data} />
      )}
    </>
  );
}
