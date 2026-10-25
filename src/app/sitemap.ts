import type { MetadataRoute } from "next";

import { fetchCategories, fetchPages, fetchProducts } from "@/lib/catalog/queries";
import { getRuntimeConfig } from "@/lib/runtime-config";
import { getSiteUrl } from "@/lib/utils/seo";

/**
 * sitemap.xml.
 *
 * Built from REAL published content: products and categories the API returns,
 * plus the CMS pages that actually resolve. Nothing is guessed - a page that
 * 404s is not listed, and no URL is invented to pad the file.
 *
 * MUST TOLERATE THE API BEING DOWN: every read goes through the
 * `{ data, error }` helpers, so a failed fetch yields just the static routes
 * and the production build still succeeds. A degraded bootstrap returns only
 * the homepage, matching `robots.ts`, which disallows everything in that state.
 */

/** Pages the storefront serves itself, independent of the catalog. */
const STATIC_PATHS = ["/", "/shop", "/pages"] as const;

const PRODUCT_LIMIT = 60;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const config = await getRuntimeConfig();
  const siteUrl = getSiteUrl(config);
  const now = new Date();

  // Degraded: the store is `noindex` everywhere and robots.txt disallows all,
  // so advertise nothing beyond the homepage.
  if (config.degraded) {
    return [{ url: `${siteUrl}/`, lastModified: now, changeFrequency: "daily", priority: 1 }];
  }

  const entries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: `${siteUrl}${path === "/" ? "/" : path}`,
    lastModified: now,
    changeFrequency: path === "/" ? "daily" : "daily",
    priority: path === "/" ? 1 : 0.8,
  }));

  const [categories, products, pages] = await Promise.all([
    fetchCategories(),
    fetchProducts({ perPage: PRODUCT_LIMIT, sort: "newest" }),
    // Every published page, from `GET /pages`. This used to probe a list of
    // likely slugs, which silently omitted any page an administrator added.
    fetchPages(),
  ]);

  for (const category of categories.data ?? []) {
    entries.push({
      url: `${siteUrl}/category/${category.slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }

  for (const product of products.data?.data ?? []) {
    // `seo.noindex` lives on the detail payload, not the card, so a product
    // marked noindex is filtered by the page's own metadata; the listing here
    // only includes what the public list endpoint returns (published only).
    entries.push({
      url: `${siteUrl}/product/${product.slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
    });
  }

  // The index already excludes `noindex` pages, so everything it returns
  // belongs in the sitemap.
  for (const page of pages.data ?? []) {
    const lastModified = page.updatedAt ? new Date(page.updatedAt) : now;
    entries.push({
      url: `${siteUrl}/pages/${page.slug}`,
      lastModified: Number.isNaN(lastModified.getTime()) ? now : lastModified,
      changeFrequency: "monthly",
      priority: 0.3,
    });
  }

  return entries;
}
