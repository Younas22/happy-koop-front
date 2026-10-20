import { NextResponse } from "next/server";

import { getViewer } from "@/lib/auth/session";

/**
 * `GET /api/auth/session` (Next.js, not Laravel) - contract 2.1.
 *
 * Returns the sanitized viewer for client components. No token, no abilities,
 * nothing privileged. `isAdmin` here is a UI affordance only; the backend
 * authorizes every admin call independently.
 */

export const dynamic = "force-dynamic";

export async function GET() {
  const viewer = await getViewer();
  return NextResponse.json(
    { data: { user: viewer } },
    { headers: { "Cache-Control": "no-store" } },
  );
}
