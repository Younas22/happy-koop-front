import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { PurchasePanel } from "@/components/product/PurchasePanel";
import { ProductReviews, ProductReviewsSkeleton } from "@/components/product/ProductReviews";
import { RelatedProducts, RelatedProductsSkeleton } from "@/components/product/RelatedProducts";
import {
  Description,
  Faqs,
  InUseMedia,
  ReturnsInfo,
  ShippingInfo,
  Specifications,
  ValueProps,
  WhatsIncluded,
} from "@/components/product/ProductSections";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ErrorState } from "@/components/ui/ErrorState";
import { fmt } from "@/i18n/format";
import type { Messages } from "@/i18n/messages";
import { getI18n } from "@/i18n/server";
import { fetchProduct } from "@/lib/catalog/queries";
import { getRuntimeConfig } from "@/lib/runtime-config";
import type { ProductDetail, ResolvedRuntimeConfig } from "@/lib/types/api";
import {
  buildBreadcrumbJsonLd,
  buildFaqJsonLd,
  buildProductJsonLd,
  serializeJsonLd,
} from "@/lib/utils/jsonld";
import { buildPageMetadata, getSiteUrl, htmlToMetaDescription } from "@/lib/utils/seo";

export async function generateMetadata({ params }: PageProps<"/product/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const [config, { data: product }, { locale, m }] = await Promise.all([
    getRuntimeConfig(),
    fetchProduct(slug),
    getI18n(),
  ]);

  if (!product) {
    return buildPageMetadata(config, { title: m.product.metaFallbackTitle, noindex: true, locale });
  }

  return buildPageMetadata(config, {
    locale,
    title: product.seo.title ?? product.name,
    description:
      product.seo.description ?? product.shortDescription ?? htmlToMetaDescription(product.description),
    canonicalPath: product.seo.canonicalPath,
    ogImageUrl: product.seo.ogImageUrl,
    noindex: product.seo.noindex,
  });
}

/**
 * Concise delivery / returns reassurance for the purchase panel.
 *
 * Built ONLY from values the store actually configured. No invented delivery
 * window, no "money-back guarantee" the store did not promise, no payment
 * badge for a provider that is disabled.
 */
function buildReassurance(
  product: ProductDetail,
  config: ResolvedRuntimeConfig,
  t: Messages["product"],
): string[] {
  const lines: string[] = [];

  const estimate = product.shippingInfo?.estimateText;
  if (estimate) lines.push(estimate);

  const windowDays = product.returnsInfo?.windowDays;
  if (windowDays) lines.push(fmt(t.returnsDays, { days: windowDays }));

  const threshold = product.shippingInfo?.freeShippingThreshold;
  if (threshold) lines.push(fmt(t.freeShippingOver, { amount: threshold.formatted }));

  if (lines.length === 0) {
    // Fall back to the store-wide summaries, if any are configured.
    if (config.policies.shippingSummary) lines.push(config.policies.shippingSummary);
    if (config.policies.returnsSummary) lines.push(config.policies.returnsSummary);
  }

  return lines;
}

/**
 * Product detail page - the hybrid IA from FRONTEND_TASK.md section 5:
 * everything needed to buy is above the fold, and every verified detail lives
 * in a clearly named section below it.
 */
export default async function ProductPage({ params }: PageProps<"/product/[slug]">) {
  const { slug } = await params;
  const config = await getRuntimeConfig();
  const { m } = await getI18n();
  const { data: product, error } = await fetchProduct(slug);

  if (error?.isNotFound()) {
    notFound();
  }

  if (!product) {
    return (
      <div className="page-container py-10">
        <ErrorState message={error?.message} unreachable={error?.isUnreachable()} />
      </div>
    );
  }

  const siteUrl = getSiteUrl(config);
  const canonicalUrl = `${siteUrl}${product.seo.canonicalPath}`;

  const productJsonLd = buildProductJsonLd({ product, config, url: canonicalUrl });
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(product.breadcrumbs, siteUrl);
  const faqJsonLd = buildFaqJsonLd(product.faqs);

  return (
    <div className="page-container py-5 sm:py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(productJsonLd) }}
      />
      {breadcrumbJsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbJsonLd) }}
        />
      ) : null}
      {faqJsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(faqJsonLd) }}
        />
      ) : null}

      <Breadcrumbs items={product.breadcrumbs} current={product.name} className="mb-4" />

      <PurchasePanel
        product={product}
        showStockCounts={config.features.publicStockCounts}
        reassurance={buildReassurance(product, config, m.product)}
      />

      <div className="mt-10 space-y-8 sm:mt-14">
        <ValueProps product={product} />
        <Description product={product} />
        <InUseMedia product={product} />
        <WhatsIncluded product={product} />
        <Specifications product={product} />
        <ShippingInfo product={product} storeShippingSummary={config.policies.shippingSummary} />
        <ReturnsInfo product={product} storeReturnsSummary={config.policies.returnsSummary} />

        <Suspense fallback={<ProductReviewsSkeleton />}>
          <ProductReviews slug={product.slug} enabled={config.features.reviews} />
        </Suspense>

        <Faqs product={product} />

        <Suspense fallback={<RelatedProductsSkeleton />}>
          <RelatedProducts slug={product.slug} />
        </Suspense>
      </div>
    </div>
  );
}
