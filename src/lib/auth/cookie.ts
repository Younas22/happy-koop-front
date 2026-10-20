/**
 * The session cookie contract (api-contract 2.1).
 *
 * The Sanctum bearer token lives ONLY in this cookie, which is owned and read
 * by the Next.js server. `httpOnly` means the browser cannot read it from
 * script, so the token is never exposed to the page, to `localStorage`, or to
 * any third-party script.
 */

export const SESSION_COOKIE_NAME = "hk_session";

/** 30 days, matching the customer token lifetime in contract 2.3. */
export const SESSION_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export interface SessionCookieOptions {
  httpOnly: true;
  secure: boolean;
  sameSite: "lax";
  path: "/";
  maxAge?: number;
}

export function sessionCookieOptions(maxAge?: number): SessionCookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    ...(maxAge === undefined ? {} : { maxAge }),
  };
}

/** Options for clearing the cookie: same attributes, zero lifetime. */
export function clearedSessionCookieOptions(): SessionCookieOptions {
  return sessionCookieOptions(0);
}
