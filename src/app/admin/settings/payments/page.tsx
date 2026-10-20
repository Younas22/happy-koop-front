import type { Metadata } from "next";
import Link from "next/link";

import { AdminError, AdminPageHeader } from "@/components/admin/AdminParts";
import { PaymentSettingsForm } from "@/components/admin/PaymentSettingsForm";
import { Button } from "@/components/ui/Button";
import { fetchPaymentSettings } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth/session";
import { getRuntimeConfig } from "@/lib/runtime-config";
import { buildPageMetadata } from "@/lib/utils/seo";

export async function generateMetadata(): Promise<Metadata> {
  const config = await getRuntimeConfig();
  return buildPageMetadata(config, {
    title: "Payment settings",
    canonicalPath: "/admin/settings/payments",
    noindex: true,
  });
}

/**
 * Payment settings.
 *
 * The API returns status only - `{configured, maskedSuffix, updatedAt}` - so
 * no secret is ever rendered, logged or sent to the browser. This page passes
 * exactly that status through to the form.
 */
export default async function AdminPaymentSettingsPage() {
  await requireAdmin("/admin/settings/payments");
  const { data, error } = await fetchPaymentSettings();

  return (
    <>
      <AdminPageHeader
        title="Payment settings"
        description="Enable providers and manage their credentials. Secrets stay on the server."
      />

      {error || !data ? (
        <AdminError
          error={error!}
          action={
            <Button asChild variant="secondary">
              <Link href="/admin/settings/payments">Try again</Link>
            </Button>
          }
        />
      ) : (
        <PaymentSettingsForm settings={data} />
      )}
    </>
  );
}
