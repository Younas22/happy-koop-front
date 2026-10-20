import { getSessionToken } from "@/lib/auth/session-token";
import { getRuntimeConfig } from "@/lib/runtime-config";
import type { ApiErrorBody, FieldErrors, Paginated, PaginationMeta } from "@/lib/types/api";
import { buildQuery, joinUrl, stripTrailingSlash, type QueryValue } from "@/lib/utils/url";

/**
 * Typed API client for the Laravel backend.
 *
 * SERVER ONLY. It resolves the base URL through the runtime-config bootstrap
 * and, for authenticated calls, reads the bearer token from the HttpOnly
 * `hk_session` cookie via `next/headers`. Neither is available in - nor safe
 * for - the browser, so the module guards against client use at runtime.
 *
 * Browser code must call a Next.js route handler under /api/* instead.
 */

const DEFAULT_TIMEOUT_MS = 10_000;

/** Normalized API failure. Every non-2xx response becomes one of these. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly errors: FieldErrors | null;

  constructor(status: number, code: string, message: string, errors: FieldErrors | null = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.errors = errors;
  }

  /** True for 422 responses that carry a field-level `errors` map. */
  isValidationError(): boolean {
    return this.status === 422 && this.errors !== null;
  }

  /** Field-path -> messages, or an empty object when not a validation error. */
  fieldErrors(): FieldErrors {
    return this.errors ?? {};
  }

  /** First message for a field path, or `null`. */
  fieldError(path: string): string | null {
    const messages = this.errors?.[path];
    return messages && messages.length > 0 ? messages[0] : null;
  }

  isNotFound(): boolean {
    return this.status === 404;
  }

  isUnauthenticated(): boolean {
    return this.status === 401;
  }

  isForbidden(): boolean {
    return this.status === 403;
  }

  /** Network failure, timeout or unreachable backend (no HTTP status). */
  isUnreachable(): boolean {
    return this.status === 0;
  }
}

function assertServerOnly(): void {
  if (typeof window !== "undefined") {
    throw new Error(
      "@/lib/api/client is server-only: it resolves the API base URL and reads the HttpOnly session cookie. Call a Next.js route handler from client components instead.",
    );
  }
}

export interface RequestOptions {
  /** Appended as a query string. Keys stay snake_case (contract 1.1). */
  query?: Record<string, QueryValue | QueryValue[]>;
  /** Seconds. Omit for an uncached request. */
  revalidate?: number | false;
  /** Cache tags for on-demand revalidation. */
  tags?: string[];
  /** Send `Authorization: Bearer` from the HttpOnly session cookie. */
  auth?: boolean;
  /** Explicit bearer token, used by the login/session route handlers. */
  token?: string | null;
  /** Extra headers. `Accept` and `Content-Type` are set automatically. */
  headers?: Record<string, string>;
  /** Abort after this many ms. Default 10000. */
  timeoutMs?: number;
  /** Guest order access token or idempotency key passthrough. */
  idempotencyKey?: string;
}

interface InternalRequest extends RequestOptions {
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  path: string;
  body?: unknown;
}

/**
 * The server-side API origin.
 * `INTERNAL_API_BASE_URL` (server-only) wins when set - e.g. an internal
 * network address - otherwise the validated runtime-config `apiBaseUrl`.
 */
export async function getApiBaseUrl(): Promise<string> {
  assertServerOnly();
  const internal = process.env.INTERNAL_API_BASE_URL?.trim();
  if (internal) return stripTrailingSlash(internal);
  const config = await getRuntimeConfig();
  return stripTrailingSlash(config.urls.apiBaseUrl);
}

function parseErrorBody(status: number, raw: unknown): ApiError {
  if (raw && typeof raw === "object") {
    const body = raw as Partial<ApiErrorBody>;
    const message =
      typeof body.message === "string" && body.message.length > 0
        ? body.message
        : `Request failed with status ${status}.`;
    const code = typeof body.code === "string" && body.code.length > 0 ? body.code : `HTTP_${status}`;
    const errors =
      body.errors && typeof body.errors === "object" && !Array.isArray(body.errors)
        ? (body.errors as FieldErrors)
        : null;
    return new ApiError(status, code, message, errors);
  }
  return new ApiError(status, `HTTP_${status}`, `Request failed with status ${status}.`);
}

async function request<T>({
  method,
  path,
  body,
  query,
  revalidate,
  tags,
  auth,
  token,
  headers,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  idempotencyKey,
}: InternalRequest): Promise<{ data: T; meta: PaginationMeta | null; summary: unknown }> {
  assertServerOnly();

  const base = await getApiBaseUrl();
  const url = joinUrl(base, path) + buildQuery(query ?? {});

  const requestHeaders: Record<string, string> = {
    Accept: "application/json",
    ...headers,
  };

  if (body !== undefined) {
    requestHeaders["Content-Type"] = "application/json";
  }
  if (idempotencyKey) {
    requestHeaders["Idempotency-Key"] = idempotencyKey;
  }

  let bearer = token ?? null;
  if (auth && !bearer) {
    bearer = await getSessionToken();
    if (!bearer) {
      throw new ApiError(401, "UNAUTHENTICATED", "You need to sign in to continue.");
    }
  }
  if (bearer) {
    requestHeaders.Authorization = `Bearer ${bearer}`;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  // An authenticated or mutating request must never be cached.
  const isCacheable = method === "GET" && !auth && !bearer && revalidate !== false;

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
      ...(isCacheable && typeof revalidate === "number"
        ? { next: { revalidate, ...(tags ? { tags } : {}) } }
        : { cache: "no-store" as const }),
    });
  } catch (error) {
    const aborted = error instanceof Error && error.name === "AbortError";
    throw new ApiError(
      0,
      aborted ? "TIMEOUT" : "NETWORK_ERROR",
      aborted
        ? "The store took too long to respond. Please try again."
        : "We could not reach the store right now. Please try again.",
    );
  } finally {
    clearTimeout(timer);
  }

  if (response.status === 204) {
    return { data: undefined as T, meta: null, summary: null };
  }

  const text = await response.text();
  let payload: unknown = null;
  if (text.length > 0) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    throw parseErrorBody(response.status, payload);
  }

  if (payload === null || typeof payload !== "object") {
    throw new ApiError(
      502,
      "BAD_RESPONSE",
      "The store returned an unexpected response. Please try again.",
    );
  }

  const envelope = payload as Record<string, unknown>;
  if (!("data" in envelope)) {
    throw new ApiError(
      502,
      "BAD_RESPONSE",
      "The store returned an unexpected response. Please try again.",
    );
  }

  const meta =
    envelope.meta && typeof envelope.meta === "object" ? (envelope.meta as PaginationMeta) : null;

  return { data: envelope.data as T, meta, summary: envelope.summary ?? null };
}

export async function apiGet<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { data } = await request<T>({ method: "GET", path, ...options });
  return data;
}

/** GET for paginated collections: returns `{ data, meta }`. */
export async function apiGetPaginated<T>(
  path: string,
  options: RequestOptions = {},
): Promise<Paginated<T>> {
  const { data, meta } = await request<T[]>({ method: "GET", path, ...options });
  return {
    data: data ?? [],
    meta:
      meta ?? {
        currentPage: 1,
        perPage: data?.length ?? 0,
        total: data?.length ?? 0,
        lastPage: 1,
        from: data && data.length > 0 ? 1 : null,
        to: data && data.length > 0 ? data.length : null,
      },
  };
}

/**
 * GET for a paginated collection that also carries a sibling key next to
 * `data`/`meta` (the reviews endpoint's `summary`, contract 4).
 */
export async function apiGetPaginatedWithSummary<T, S>(
  path: string,
  options: RequestOptions = {},
): Promise<Paginated<T> & { summary: S | null }> {
  const { data, meta, summary } = await request<T[]>({ method: "GET", path, ...options });
  const items = data ?? [];
  return {
    data: items,
    meta:
      meta ?? {
        currentPage: 1,
        perPage: items.length,
        total: items.length,
        lastPage: 1,
        from: items.length > 0 ? 1 : null,
        to: items.length > 0 ? items.length : null,
      },
    summary: (summary as S | null) ?? null,
  };
}

export async function apiPost<T>(
  path: string,
  body?: unknown,
  options: RequestOptions = {},
): Promise<T> {
  const { data } = await request<T>({ method: "POST", path, body, ...options });
  return data;
}

export async function apiPatch<T>(
  path: string,
  body?: unknown,
  options: RequestOptions = {},
): Promise<T> {
  const { data } = await request<T>({ method: "PATCH", path, body, ...options });
  return data;
}

export async function apiPut<T>(
  path: string,
  body?: unknown,
  options: RequestOptions = {},
): Promise<T> {
  const { data } = await request<T>({ method: "PUT", path, body, ...options });
  return data;
}

export async function apiDelete<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { data } = await request<T>({ method: "DELETE", path, ...options });
  return data;
}

/**
 * Runs a read and converts "backend unreachable / not found" into `null`
 * instead of an exception, so a page can render a real empty or error state.
 * Used by build-time data fetches: the production build must succeed with the
 * API down.
 */
export async function tryApi<T>(fn: () => Promise<T>): Promise<{ data: T | null; error: ApiError | null }> {
  try {
    return { data: await fn(), error: null };
  } catch (error) {
    if (error instanceof ApiError) {
      return { data: null, error };
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    return { data: null, error: new ApiError(0, "NETWORK_ERROR", message) };
  }
}
