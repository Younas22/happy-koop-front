import type { Metadata } from "next";

import type { ResolvedRuntimeConfig } from "@/lib/types/api";
import { stripTrailingSlash } from "@/lib/utils/url";

/**
 * Metadata built from runtime config plus page data. Only real values are
 * emitted: a missing description or OG image is omitted rather than filled
 * with a placeholder.
 */

export function getSiteUrl(config: ResolvedRuntimeConfig): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const candidate = config.urls.canonicalFrontendUrl || fromEnv || "http://localhost:3000";
  try {
    return stripTrailingSlash(new URL(candidate).toString());
  } catch {
    return "http://localhost:3000";
  }
}

function absoluteUrl(config: ResolvedRuntimeConfig, path: string | null): string | null {
  if (!path) return null;
  try {
    return new URL(path, `${getSiteUrl(config)}/`).toString();
  } catch {
    return null;
  }
}

export interface PageSeoInput {
  /** Page-specific title. Omit for the site default title. */
  title?: string | null;
  description?: string | null;
  /** Site-root-relative path, e.g. `/product/foo`. */
  canonicalPath?: string | null;
  ogImageUrl?: string | null;
  noindex?: boolean;
  /** `website` for listings, `article` for CMS pages. */
  ogType?: "website" | "article";
}

/** Root metadata: title template, canonical base, favicon and OG defaults. */
export function buildRootMetadata(config: ResolvedRuntimeConfig): Metadata {
  const siteUrl = getSiteUrl(config);
  const { seo, store } = config;

  const metadata: Metadata = {
    metadataBase: new URL(siteUrl),
    title: {
      default: seo.defaultTitle || store.name,
      template: seo.titleTemplate && seo.titleTemplate.includes("%s") ? seo.titleTemplate : `%s | ${store.name}`,
    },
    applicationName: store.name,
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      siteName: store.name,
      url: siteUrl,
      title: seo.defaultTitle || store.name,
      ...(seo.defaultDescription ? { description: seo.defaultDescription } : {}),
      ...(seo.defaultOgImageUrl ? { images: [{ url: seo.defaultOgImageUrl }] } : {}),
    },
    twitter: {
      card: seo.defaultOgImageUrl ? "summary_large_image" : "summary",
    },
  };

  if (seo.defaultDescription) {
    metadata.description = seo.defaultDescription;
  }

  if (store.faviconUrl) {
    metadata.icons = { icon: store.faviconUrl };
  }

  // A degraded bootstrap means we cannot vouch for the catalog; keep the store
  // out of search indexes rather than publishing an empty shell.
  if (config.degraded) {
    metadata.robots = { index: false, follow: false };
  }

  return metadata;
}

/** Per-page metadata layered over the root defaults. */
export function buildPageMetadata(config: ResolvedRuntimeConfig, input: PageSeoInput): Metadata {
  const metadata: Metadata = {};

  if (input.title) {
    metadata.title = input.title;
  }

  const description = input.description ?? null;
  if (description) {
    metadata.description = description;
  }

  if (input.canonicalPath) {
    metadata.alternates = { canonical: input.canonicalPath };
  }

  const ogImage = absoluteUrl(config, input.ogImageUrl ?? null) ?? config.seo.defaultOgImageUrl;
  const ogUrl = absoluteUrl(config, input.canonicalPath ?? null);

  metadata.openGraph = {
    type: input.ogType ?? "website",
    siteName: config.store.name,
    title: input.title ?? config.seo.defaultTitle,
    ...(description ? { description } : {}),
    ...(ogUrl ? { url: ogUrl } : {}),
    ...(ogImage ? { images: [{ url: ogImage }] } : {}),
  };

  if (input.noindex || config.degraded) {
    metadata.robots = { index: false, follow: false };
  }

  return metadata;
}

/** Trims admin HTML to a plain-text meta description without inventing text. */
export function htmlToMetaDescription(html: string | null, maxLength = 160): string | null {
  if (!html) return null;
  const text = html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return null;
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trimEnd()}…`;
}
