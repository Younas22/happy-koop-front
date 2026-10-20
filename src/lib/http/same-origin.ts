import { asApiErrorPayload, type ApiErrorPayload } from "@/lib/forms/api-errors";

/**
 * Browser-side fetch helper for this app's OWN route handlers under `/api/*`.
 *
 * The browser never calls Laravel directly: the API origin is resolved and
 * validated server-side, and the bearer token lives in an HttpOnly cookie the
 * page cannot read (contract 2.1, 3). Every client mutation therefore goes
 * through a same-origin route handler, which is what this helper talks to.
 */

export type SameOriginResult<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; error: ApiErrorPayload };

const UNREACHABLE: ApiErrorPayload = {
  message: "We could not reach the store right now. Please try again.",
  code: "NETWORK_ERROR",
  errors: null,
};

export async function requestSameOrigin<T>(
  path: string,
  init: RequestInit = {},
): Promise<SameOriginResult<T>> {
  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init.body !== undefined && !(init.body instanceof FormData)
          ? { "Content-Type": "application/json" }
          : {}),
        ...init.headers,
      },
    });
  } catch {
    return { ok: false, status: 0, error: UNREACHABLE };
  }

  if (response.status === 204) {
    return { ok: true, status: 204, data: undefined as T };
  }

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      error:
        asApiErrorPayload(payload) ?? {
          message: "Something went wrong. Please try again.",
          code: `HTTP_${response.status}`,
          errors: null,
        },
    };
  }

  const data =
    payload && typeof payload === "object" && "data" in payload
      ? (payload as { data: T }).data
      : (payload as T);

  return { ok: true, status: response.status, data };
}

export function postSameOrigin<T>(
  path: string,
  body: unknown,
  init: RequestInit = {},
): Promise<SameOriginResult<T>> {
  return requestSameOrigin<T>(path, {
    ...init,
    method: "POST",
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}
