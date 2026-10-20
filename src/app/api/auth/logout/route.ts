import { NextResponse } from "next/server";

import { apiPost, tryApi } from "@/lib/api/client";
import { SESSION_COOKIE_NAME, clearedSessionCookieOptions } from "@/lib/auth/cookie";
import { getSessionToken } from "@/lib/auth/session-token";
import type { OkResult } from "@/lib/types/api";

/**
 * `POST /api/auth/logout` (Next.js, same-origin).
 *
 * Revokes the token upstream (`POST /api/v1/auth/logout` revokes only the
 * presented token, contract 2.3) and clears the cookie. The cookie is cleared
 * even when the upstream revoke fails, so the browser is never left holding a
 * session the user asked to end.
 */

export const dynamic = "force-dynamic";

export async function POST() {
  const token = await getSessionToken();

  if (token) {
    await tryApi(() =>
      apiPost<OkResult>("/auth/logout", undefined, { token, revalidate: false, timeoutMs: 6_000 }),
    );
  }

  const response = NextResponse.json({ data: { ok: true } });
  response.cookies.set(SESSION_COOKIE_NAME, "", clearedSessionCookieOptions());
  return response;
}
