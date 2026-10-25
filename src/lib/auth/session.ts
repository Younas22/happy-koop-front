import { redirect } from "next/navigation";

import { apiGet, tryApi } from "@/lib/api/client";
import { getSessionToken } from "@/lib/auth/session-token";
import type { User } from "@/lib/types/api";
import { localized } from "@/i18n/server";

/**
 * Server-only session helpers.
 *
 * IMPORTANT: `User.isAdmin` is a UI affordance only. It decides whether an
 * admin link or screen is rendered - it is NOT access control. Every admin
 * endpoint independently authorizes the request server-side via Sanctum
 * abilities, `EnsureUserIsAdmin` middleware and a Policy (api-contract 2.2,
 * 8). A forged or stale `isAdmin` can reveal a menu; it can never perform an
 * admin action.
 */

export { getSessionToken };

/**
 * Resolves the current viewer from the session cookie.
 * Never throws: an expired, revoked or absent token yields `null`, and an
 * unreachable backend also yields `null` rather than breaking the page.
 */
export async function getViewer(): Promise<User | null> {
  const token = await getSessionToken();
  if (!token) return null;

  // Laravel nests the viewer under `data.user`, mirroring the login payload
  // (api-contract.md 2.5). Unwrapping only `data` here would yield the
  // wrapper object, whose `isAdmin` is undefined - which silently denied
  // real admins before this was pinned down.
  const { data } = await tryApi(() =>
    apiGet<{ user: User | null }>("/auth/me", {
      token,
      revalidate: false,
      timeoutMs: 6_000,
    }),
  );
  return data?.user ?? null;
}

/** Requires a signed-in viewer, otherwise redirects to login with a return path. */
export async function requireViewer(nextPath: string): Promise<User> {
  const viewer = await getViewer();
  if (!viewer) {
    // Both the sign-in page and the way back stay in the visitor's language.
    redirect(await localized(`/login?next=${encodeURIComponent(await localized(nextPath))}`));
  }
  return viewer;
}

/**
 * Requires a viewer whose `isAdmin` affordance is set. This only gates UI; the
 * backend authorizes every admin call regardless of what happens here.
 */
export async function requireAdmin(nextPath: string): Promise<User> {
  const viewer = await getViewer();
  if (!viewer) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }
  if (!viewer.isAdmin) {
    redirect("/admin/forbidden");
  }
  return viewer;
}
