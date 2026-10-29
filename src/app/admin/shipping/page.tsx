import type { Metadata } from "next";
import Link from "next/link";

import { AdminError, AdminPageHeader } from "@/components/admin/AdminParts";
import { ShippingZoneManager } from "@/components/admin/ShippingZoneManager";
import { Button } from "@/components/ui/Button";
import { fetchAdminShippingZones } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth/session";
import { getRuntimeConfig } from "@/lib/runtime-config";
import { buildPageMetadata } from "@/lib/utils/seo";

export async function generateMetadata(): Promise<Metadata> {
  const config = await getRuntimeConfig();
  return buildPageMetadata(config, {
    title: "Shipping",
    canonicalPath: "/admin/shipping",
    noindex: true,
  });
}

export default async function AdminShippingPage() {
  await requireAdmin("/admin/shipping");

  const [{ data, error }, config] = await Promise.all([
    fetchAdminShippingZones(),
    getRuntimeConfig(),
  ]);

  return (
    <>
      <AdminPageHeader
        title="Shipping"
        description="Checkout only delivers to countries covered by an active zone with at least one active rate."
      />

      {error ? (
        <AdminError
          error={error}
          action={
            <Button asChild variant="secondary">
              <Link href="/admin/shipping">Try again</Link>
            </Button>
          }
        />
      ) : (
        <ShippingZoneManager
          zones={data ?? []}
          currency={config.locale.currency}
          minorUnitExponent={config.locale.minorUnitExponent}
          locale={config.locale.locale}
        />
      )}
    </>
  );
}
