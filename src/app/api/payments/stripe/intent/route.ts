import { NextResponse } from "next/server";
import { z } from "zod";

import { ApiError } from "@/lib/api/client";
import { getSessionToken } from "@/lib/auth/session-token";
import { readOrderAccess } from "@/lib/checkout/order-access";
import { createStripeIntent } from "@/lib/checkout/queries";

/**
 * `POST /api/payments/stripe/intent` - same-origin proxy to
 * `POST /api/v1/payments/stripe/intent` (contract 6).
 *
 * The browser never calls Laravel directly, and it never supplies the order's
 * access token: the token is read from the HttpOnly cookie written at
 * initialize, so a page cannot pay for an order it was not given.
 *
 * `clientSecret` IS returned to the browser - it is a single-order,
 * client-side confirmation credential, not an API secret. The Stripe secret
 * key and webhook secret never leave the backend and are not reachable from
 * here.
 */

export const dynamic = "force-dynamic";

const schema = z.object({
  orderNumber: z.string().trim().min(1).max(64),
});

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Malformed request body.", code: "BAD_REQUEST", errors: null },
      { status: 400 },
    );
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "The order could not be identified.", code: "BAD_REQUEST", errors: null },
      { status: 400 },
    );
  }

  const { orderNumber } = parsed.data;
  const access = await readOrderAccess(orderNumber);
  const hasSession = (await getSessionToken()) !== null;

  // Without either proof of access the request is refused locally rather than
  // being forwarded with no credential.
  if (!access?.accessToken && !hasSession) {
    return NextResponse.json(
      {
        message: "This payment session has expired. Start checkout again.",
        code: "UNAUTHENTICATED",
        errors: null,
      },
      { status: 401 },
    );
  }

  try {
    const result = await createStripeIntent(
      { orderNumber, accessToken: access?.accessToken ?? null },
      { auth: hasSession },
    );
    return NextResponse.json({ data: result }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { message: error.message, code: error.code, errors: error.errors },
        { status: error.status === 0 ? 503 : error.status },
      );
    }
    return NextResponse.json(
      {
        message: "Card payment is unavailable right now. Nothing has been charged.",
        code: "SERVICE_UNAVAILABLE",
        errors: null,
      },
      { status: 503 },
    );
  }
}
