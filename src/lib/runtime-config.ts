import { revalidateTag } from "next/cache";
import { z } from "zod";

import type { ResolvedRuntimeConfig, RuntimeConfig } from "@/lib/types/api";
import { isAllowedApiBaseUrl, parseAllowedHosts, stripTrailingSlash } from "@/lib/utils/url";

/**
 * Runtime config bootstrap (contract 3).
 *
 * 1. Read the deployment-time `NEXT_PUBLIC_API_BOOTSTRAP_URL`.
 * 2. `GET {bootstrap}/api/v1/public/runtime-config`, cached 60s, tag
 *    `runtime-config`.
 * 3. VALIDATE `data.urls.apiBaseUrl` before it is ever used as a fetch target.
 *    Scheme must be http/https, in production https is required, and the host
 *    must appear in `NEXT_PUBLIC_ALLOWED_API_HOSTS`. On failure we log and keep
 *    using the bootstrap origin. An unvalidated URL is never followed.
 * 4. If the bootstrap fetch fails entirely, fall back to
 *    `NEXT_PUBLIC_API_BASE_URL` and return neutral defaults with
 *    `degraded: true` so the store renders instead of crashing - and so the UI
 *    can be honest rather than display invented store details.
 */

export const RUNTIME_CONFIG_TAG = "runtime-config";
export const RUNTIME_CONFIG_PATH = "/api/v1/public/runtime-config";
const RUNTIME_CONFIG_REVALIDATE_SECONDS = 60;
const BOOTSTRAP_TIMEOUT_MS = 8_000;

/** Fallback brand colour, also the documented default in globals.css. */
export const DEFAULT_BRAND_HEX = "#2563EB";

/** Per-language overrides; any language without one falls back to the default text. */
const localizedLabelsSchema = z
  .object({ en: z.string().nullable().optional(), nl: z.string().nullable().optional() })
  .nullable()
  .optional();

const navLinkSchema = z.object({
  label: z.string(),
  href: z.string(),
  labels: localizedLabelsSchema,
});

const runtimeConfigSchema = z.object({
  configVersion: z.string(),
  store: z.object({
    name: z.string(),
    tagline: z.string().nullable(),
    logoUrl: z.string().nullable(),
    logoDarkUrl: z.string().nullable(),
    faviconUrl: z.string().nullable(),
    email: z.string().nullable(),
    phone: z.string().nullable(),
    addressLines: z.array(z.string()),
  }),
  theme: z.object({
    primaryColor: z.string(),
    accentColor: z.string(),
    radius: z.string(),
  }),
  locale: z.object({
    currency: z.string(),
    currencySymbol: z.string(),
    minorUnitExponent: z.number().int().min(0).max(4),
    locale: z.string(),
    timezone: z.string(),
  }),
  urls: z.object({
    apiBaseUrl: z.string(),
    canonicalFrontendUrl: z.string(),
  }),
  seo: z.object({
    defaultTitle: z.string(),
    titleTemplate: z.string(),
    defaultDescription: z.string().nullable(),
    defaultOgImageUrl: z.string().nullable(),
  }),
  policies: z.object({
    shippingSummary: z.string().nullable(),
    returnsSummary: z.string().nullable(),
  }),
  features: z.object({
    reviews: z.boolean(),
    wishlist: z.boolean(),
    newsletter: z.boolean(),
    guestCheckout: z.boolean(),
    search: z.boolean(),
    publicStockCounts: z.boolean(),
  }),
  payments: z.object({
    stripe: z.object({
      enabled: z.boolean(),
      mode: z.string(),
      publishableKey: z.string().nullable(),
    }),
    paypal: z.object({
      enabled: z.boolean(),
      mode: z.string(),
      clientId: z.string().nullable(),
    }),
  }),
  social: z.object({
    instagram: z.string().nullable(),
    facebook: z.string().nullable(),
    tiktok: z.string().nullable(),
    x: z.string().nullable(),
  }),
  navigation: z.object({
    primary: z.array(navLinkSchema),
    footer: z.array(
      z.object({
        heading: z.string(),
        headings: localizedLabelsSchema,
        links: z.array(navLinkSchema),
      }),
    ),
  }),
});

const envelopeSchema = z.object({ data: runtimeConfigSchema });

/** The standalone schema for `urls.apiBaseUrl`, exported for tests. */
export const apiBaseUrlSchema = z.string().min(1);

export function getBootstrapOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_API_BOOTSTRAP_URL?.trim();
  return stripTrailingSlash(raw && raw.length > 0 ? raw : "http://127.0.0.1:8000");
}

function getFallbackApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (raw) return stripTrailingSlash(raw);
  return `${getBootstrapOrigin()}/api/v1`;
}

function getAllowedHosts(): string[] {
  const hosts = parseAllowedHosts(process.env.NEXT_PUBLIC_ALLOWED_API_HOSTS);
  if (hosts.length > 0) return hosts;
  // No allowlist configured: trust only the bootstrap origin's own host.
  try {
    return [new URL(getBootstrapOrigin()).hostname.toLowerCase()];
  } catch {
    return [];
  }
}

/**
 * Neutral defaults. Nothing here invents store content: no tagline, no logo,
 * no address, no policy text, no navigation. Payment providers are disabled so
 * no checkout path is offered that the backend has not confirmed.
 */
export function buildDefaultRuntimeConfig(apiBaseUrl: string): RuntimeConfig {
  const siteUrl = stripTrailingSlash(process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000");
  return {
    configVersion: "0",
    store: {
      name: "HappyKoop",
      tagline: null,
      logoUrl: null,
      logoDarkUrl: null,
      faviconUrl: null,
      email: null,
      phone: null,
      addressLines: [],
    },
    theme: {
      primaryColor: DEFAULT_BRAND_HEX,
      accentColor: DEFAULT_BRAND_HEX,
      radius: "md",
    },
    locale: {
      currency: "USD",
      currencySymbol: "$",
      minorUnitExponent: 2,
      locale: "en-US",
      timezone: "UTC",
    },
    urls: {
      apiBaseUrl,
      canonicalFrontendUrl: siteUrl,
    },
    seo: {
      defaultTitle: "HappyKoop",
      titleTemplate: "%s | HappyKoop",
      defaultDescription: null,
      defaultOgImageUrl: null,
    },
    policies: {
      shippingSummary: null,
      returnsSummary: null,
    },
    features: {
      reviews: false,
      wishlist: false,
      newsletter: false,
      guestCheckout: false,
      search: true,
      publicStockCounts: false,
    },
    payments: {
      stripe: { enabled: false, mode: "test", publishableKey: null },
      paypal: { enabled: false, mode: "sandbox", clientId: null },
    },
    social: { instagram: null, facebook: null, tiktok: null, x: null },
    navigation: { primary: [], footer: [] },
  };
}

/** Degraded config used when the bootstrap endpoint cannot be reached. */
export function getDefaultRuntimeConfig(): ResolvedRuntimeConfig {
  return {
    ...buildDefaultRuntimeConfig(getFallbackApiBaseUrl()),
    degraded: true,
    apiBaseUrlRejected: false,
  };
}

/** Back-compat alias for the constant name used in the task brief. */
export const DEFAULT_RUNTIME_CONFIG_FACTORY = getDefaultRuntimeConfig;

/**
 * Resolves the API base URL the frontend will actually use.
 * Exported so it can be unit-tested without a network call.
 */
export function resolveApiBaseUrl(
  candidate: string | null | undefined,
  options?: { allowedHosts?: readonly string[]; requireHttps?: boolean; bootstrapOrigin?: string },
): { apiBaseUrl: string; rejected: boolean } {
  const bootstrapOrigin = options?.bootstrapOrigin ?? getBootstrapOrigin();
  const bootstrapApiBase = `${bootstrapOrigin}/api/v1`;
  const result = isAllowedApiBaseUrl(candidate, {
    allowedHosts: options?.allowedHosts ?? getAllowedHosts(),
    requireHttps: options?.requireHttps ?? process.env.NODE_ENV === "production",
  });

  if (result.ok && result.url) {
    return { apiBaseUrl: result.url, rejected: false };
  }

  console.warn(
    `[runtime-config] rejected apiBaseUrl (${result.reason}); falling back to the bootstrap origin.`,
  );
  return { apiBaseUrl: bootstrapApiBase, rejected: true };
}

/**
 * Fetches, validates and caches the public runtime config.
 * Never throws: a failure yields the degraded default so the storefront still
 * renders a real error/empty state instead of a crash.
 */
export async function getRuntimeConfig(): Promise<ResolvedRuntimeConfig> {
  const bootstrapOrigin = getBootstrapOrigin();
  const url = `${bootstrapOrigin}${RUNTIME_CONFIG_PATH}`;

  let payload: unknown;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), BOOTSTRAP_TIMEOUT_MS);
    try {
      const response = await fetch(url, {
        headers: { Accept: "application/json" },
        signal: controller.signal,
        next: { revalidate: RUNTIME_CONFIG_REVALIDATE_SECONDS, tags: [RUNTIME_CONFIG_TAG] },
      });
      if (!response.ok) {
        console.warn(`[runtime-config] bootstrap returned ${response.status}; using degraded defaults.`);
        return getDefaultRuntimeConfig();
      }
      payload = await response.json();
    } finally {
      clearTimeout(timer);
    }
  } catch (error) {
    const reason = error instanceof Error ? error.message : "unknown error";
    console.warn(`[runtime-config] bootstrap fetch failed (${reason}); using degraded defaults.`);
    return getDefaultRuntimeConfig();
  }

  const parsed = envelopeSchema.safeParse(payload);
  if (!parsed.success) {
    console.warn("[runtime-config] bootstrap payload did not match the contract; using degraded defaults.");
    return getDefaultRuntimeConfig();
  }

  const config = parsed.data.data;
  const { apiBaseUrl, rejected } = resolveApiBaseUrl(config.urls.apiBaseUrl, { bootstrapOrigin });

  return {
    ...config,
    urls: { ...config.urls, apiBaseUrl },
    degraded: false,
    apiBaseUrlRejected: rejected,
  };
}

/**
 * Explicit refresh mechanism (contract 3, rule 6: never cache indefinitely).
 *
 * Called by `saveStoreSettingsAction` and `savePaymentSettingsAction` (see
 * `src/app/admin/actions.ts`) after a successful write, so a change to the
 * store name, branding, locale, URLs or provider enablement reaches the
 * storefront immediately instead of waiting out the 60s window.
 */
export function revalidateRuntimeConfig(): void {
  revalidateTag(RUNTIME_CONFIG_TAG, "max");
}
