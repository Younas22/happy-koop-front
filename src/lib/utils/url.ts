/**
 * URL helpers.
 *
 * `isAllowedApiBaseUrl` implements the bootstrap validation of contract 3:
 * an `apiBaseUrl` coming from admin-editable settings is never followed unless
 * its scheme and host pass an explicit allowlist.
 */

/** Parses the comma-separated `NEXT_PUBLIC_ALLOWED_API_HOSTS` value. */
export function parseAllowedHosts(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(",")
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);
}

export interface AllowedApiBaseUrlOptions {
  /** Hostnames permitted for the API. Empty list rejects everything. */
  allowedHosts: readonly string[];
  /** When true, only `https:` is accepted. */
  requireHttps: boolean;
}

export interface UrlValidationResult {
  ok: boolean;
  /** Present only when `ok` is true: the normalized absolute URL. */
  url: string | null;
  /** Machine-readable rejection reason, for logging. */
  reason:
    | null
    | "empty"
    | "unparseable"
    | "bad_scheme"
    | "https_required"
    | "host_not_allowed"
    | "credentials_in_url";
}

/**
 * Validates an API base URL against the deployment allowlist.
 *
 * Rejects: non-absolute / unparseable values, schemes other than http(s),
 * plain http in production, embedded credentials, and any host not explicitly
 * allowlisted. Never follows an unvalidated URL (contract 3, step 3).
 */
export function isAllowedApiBaseUrl(
  value: string | null | undefined,
  options: AllowedApiBaseUrlOptions,
): UrlValidationResult {
  const raw = (value ?? "").trim();
  if (!raw) return { ok: false, url: null, reason: "empty" };

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return { ok: false, url: null, reason: "unparseable" };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, url: null, reason: "bad_scheme" };
  }

  if (options.requireHttps && parsed.protocol !== "https:") {
    return { ok: false, url: null, reason: "https_required" };
  }

  if (parsed.username || parsed.password) {
    return { ok: false, url: null, reason: "credentials_in_url" };
  }

  const host = parsed.hostname.toLowerCase();
  const allowed = options.allowedHosts.map((h) => h.toLowerCase());
  if (!allowed.includes(host)) {
    return { ok: false, url: null, reason: "host_not_allowed" };
  }

  return { ok: true, url: stripTrailingSlash(parsed.toString()), reason: null };
}

export function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

/** Joins a base URL and a path without doubling or dropping the separator. */
export function joinUrl(base: string, path: string): string {
  if (!path) return stripTrailingSlash(base);
  return `${stripTrailingSlash(base)}/${path.replace(/^\/+/, "")}`;
}

export type QueryValue = string | number | boolean | null | undefined;

/**
 * Builds a query string, dropping null/undefined/empty values so the API never
 * receives meaningless filters. Query keys stay snake_case per contract 1.1.
 */
export function buildQuery(params: Record<string, QueryValue | QueryValue[]>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    const values = Array.isArray(value) ? value : [value];
    for (const item of values) {
      if (item === null || item === undefined) continue;
      const asString = typeof item === "boolean" ? (item ? "1" : "0") : String(item);
      if (asString === "") continue;
      search.append(key, asString);
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

/**
 * Only same-origin, path-only redirect targets are accepted, so a `?next=`
 * parameter can never be used as an open redirect.
 */
export function safeInternalPath(value: string | null | undefined, fallback = "/"): string {
  const raw = (value ?? "").trim();
  if (!raw.startsWith("/")) return fallback;
  if (raw.startsWith("//")) return fallback;
  if (raw.includes("\\")) return fallback;
  return raw;
}
