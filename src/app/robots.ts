import type { MetadataRoute } from "next";

import { getRuntimeConfig } from "@/lib/runtime-config";
import { getSiteUrl } from "@/lib/utils/seo";

/**
 * robots.txt.
 *
 * Private and transactional areas are disallowed: nothing under `/account`,
 * `/admin` or `/checkout` should ever be crawled, and neither should the
 * internal route handlers under `/api`.
 *
 * DEGRADED STATE: when the runtime-config bootstrap fails, the storefront
 * cannot vouch for its own catalog and the foundation already marks every page
 * `noindex`. This file agrees with that rather than contradicting it - it
 * disallows everything, so a degraded deployment is not indexed as an empty
 * shell.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const config = await getRuntimeConfig();
  const siteUrl = getSiteUrl(config);

  if (config.degraded) {
    return {
      rules: [{ userAgent: "*", disallow: "/" }],
      // No sitemap is advertised while the catalog cannot be verified.
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/account",
          "/account/",
          "/admin",
          "/admin/",
          "/checkout",
          "/checkout/",
          "/api/",
          "/login",
          "/register",
          "/forgot-password",
          "/reset-password",
          "/cart",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
