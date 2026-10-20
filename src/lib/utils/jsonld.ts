import { toMajorUnitString } from "@/lib/money";
import type {
  Breadcrumb,
  ProductDetail,
  ResolvedRuntimeConfig,
  ReviewSummary,
} from "@/lib/types/api";

/**
 * JSON-LD built from truthful fields only.
 *
 * Rules:
 *  - `aggregateRating` is OMITTED when `rating` is null (zero approved
 *    reviews). A rating is never emitted as 0 or as a seeded default.
 *  - `priceValidUntil` is NEVER emitted: the API carries no price expiry, so
 *    claiming one would be fabricated.
 *  - `availability` is omitted for states the schema.org vocabulary cannot
 *    truthfully express from our data.
 *  - Optional fields (brand, sku, gtin, weight, description) are omitted when
 *    the backend returned null.
 */

export type JsonLdValue =
  | string
  | number
  | boolean
  | null
  | JsonLdValue[]
  | { [key: string]: JsonLdValue };

export type JsonLdObject = { [key: string]: JsonLdValue };

/** schema.org ItemAvailability, only for states we can state truthfully. */
function schemaAvailability(state: ProductDetail["availability"]["state"]): string | null {
  switch (state) {
    case "in_stock":
    case "low_stock":
      return "https://schema.org/InStock";
    case "out_of_stock":
      return "https://schema.org/OutOfStock";
    case "preorder":
      return "https://schema.org/PreOrder";
    case "unavailable":
      // No honest schema.org equivalent for "withdrawn"; omit the claim.
      return null;
    default:
      return null;
  }
}

export interface ProductJsonLdInput {
  product: ProductDetail;
  config: ResolvedRuntimeConfig;
  /** Absolute canonical URL of the product page. */
  url: string;
  /** Only used to emit `reviewCount`; omitted entirely when null. */
  reviewSummary?: ReviewSummary | null;
}

export function buildProductJsonLd({
  product,
  config,
  url,
  reviewSummary = null,
}: ProductJsonLdInput): JsonLdObject {
  const images = product.media.filter((item) => item.type === "image").map((item) => item.url);

  const jsonLd: JsonLdObject = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    url,
  };

  if (images.length > 0) jsonLd.image = images;
  if (product.shortDescription) jsonLd.description = product.shortDescription;
  if (product.sku) jsonLd.sku = product.sku;
  if (product.brand) jsonLd.brand = { "@type": "Brand", name: product.brand };

  // Offers. No priceValidUntil - the API does not model one.
  const availability = schemaAvailability(product.availability.state);
  const offer: JsonLdObject = {
    "@type": "Offer",
    url,
    priceCurrency: product.price.currency,
    price: toMajorUnitString(product.price, config.locale.minorUnitExponent),
  };
  if (availability) offer.availability = availability;
  jsonLd.offers = offer;

  // Ratings only when real approved reviews exist.
  if (product.rating !== null && product.rating.count > 0) {
    jsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: product.rating.average,
      reviewCount: reviewSummary?.count ?? product.rating.count,
      bestRating: 5,
      worstRating: 1,
    };
  }

  if (product.shippingDimensions?.weightGrams) {
    jsonLd.weight = {
      "@type": "QuantitativeValue",
      value: product.shippingDimensions.weightGrams,
      unitCode: "GRM",
    };
  }

  return jsonLd;
}

export function buildBreadcrumbJsonLd(crumbs: readonly Breadcrumb[], siteUrl: string): JsonLdObject | null {
  if (crumbs.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.label,
      item: `${siteUrl}${crumb.href.startsWith("/") ? crumb.href : `/${crumb.href}`}`,
    })),
  };
}

/** Organization data, emitted only from configured store values. */
export function buildOrganizationJsonLd(
  config: ResolvedRuntimeConfig,
  siteUrl: string,
): JsonLdObject {
  const jsonLd: JsonLdObject = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: config.store.name,
    url: siteUrl,
  };
  if (config.store.logoUrl) jsonLd.logo = config.store.logoUrl;
  const sameAs = [
    config.social.instagram,
    config.social.facebook,
    config.social.tiktok,
    config.social.x,
  ].filter((value): value is string => typeof value === "string" && value.length > 0);
  if (sameAs.length > 0) jsonLd.sameAs = sameAs;
  return jsonLd;
}

/** FAQPage, only when the product actually has admin-authored FAQs. */
export function buildFaqJsonLd(faqs: ProductDetail["faqs"]): JsonLdObject | null {
  if (faqs.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };
}

/**
 * Serializes JSON-LD for a `<script type="application/ld+json">` tag,
 * escaping `<` so the payload cannot break out of the script element.
 */
export function serializeJsonLd(value: JsonLdObject): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
