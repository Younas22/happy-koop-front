import { cookies } from "next/headers";

import { SESSION_COOKIE_NAME } from "@/lib/auth/cookie";

/**
 * Reads the bearer token from the HttpOnly session cookie.
 *
 * SERVER ONLY. Kept in its own module so `@/lib/api/client` can read the token
 * without importing the viewer helpers that themselves use the client.
 */
export async function getSessionToken(): Promise<string | null> {
  if (typeof window !== "undefined") {
    throw new Error("getSessionToken is server-only: the session token is never exposed to the browser.");
  }
  try {
    const store = await cookies();
    const value = store.get(SESSION_COOKIE_NAME)?.value;
    return value && value.length > 0 ? value : null;
  } catch {
    // `cookies()` throws outside a request scope (e.g. during prerender of a
    // fully static route). No cookie means no session.
    return null;
  }
}
