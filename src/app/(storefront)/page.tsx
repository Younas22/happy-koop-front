import { PackageSearch } from "lucide-react";
import { Link } from "@/i18n/Link";
import { Suspense } from "react";

import { HomeSections } from "@/components/home/HomeSections";
import { ProductGridSkeleton } from "@/components/product/ProductGrid";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { getMessages } from "@/i18n/server";
import { fetchHomeContent } from "@/lib/catalog/queries";
import { getRuntimeConfig } from "@/lib/runtime-config";
import { buildOrganizationJsonLd, serializeJsonLd } from "@/lib/utils/jsonld";
import { getSiteUrl } from "@/lib/utils/seo";

/**
 * Home page. The composition comes entirely from `GET /home`; there is no
 * hardcoded hero, no stock imagery and no placeholder product row. If the
 * endpoint is unreachable the page says so.
 */

function HomeSkeleton() {
  return (
    <div className="page-container pt-8">
      <div className="skeleton h-64 rounded-lg sm:h-80" />
      <ProductGridSkeleton className="mt-10" count={4} />
    </div>
  );
}

async function HomeContentBlock() {
  const [{ data, error }, m] = await Promise.all([fetchHomeContent(), getMessages()]);

  if (!data) {
    return (
      <div className="page-container py-10">
        <ErrorState
          message={error?.message}
          unreachable={error?.isUnreachable()}
          action={
            <Button asChild variant="secondary">
              <Link href="/shop">{m.common.browseShop}</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const hasContent = data.hero !== null || data.sections.length > 0;

  if (!hasContent) {
    return (
      <div className="page-container py-10">
        <EmptyState
          icon={PackageSearch}
          title={m.home.notSetUpTitle}
          description={m.home.notSetUpBody}
          action={
            <Button asChild>
              <Link href="/shop">{m.common.browseShop}</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <>
      <HomeSections content={data} />
      <div className="pb-4" />
    </>
  );
}

export default async function HomePage() {
  const config = await getRuntimeConfig();
  const siteUrl = getSiteUrl(config);

  return (
    <>
      <script
        type="application/ld+json"
        // Built only from configured store values.
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(buildOrganizationJsonLd(config, siteUrl)),
        }}
      />
      <Suspense fallback={<HomeSkeleton />}>
        <HomeContentBlock />
      </Suspense>
    </>
  );
}
