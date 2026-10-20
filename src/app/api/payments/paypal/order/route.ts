import { NextResponse } from "next/server";
import { z } from "zod";

import { ApiError } from "@/lib/api/client";
import { getSessionToken } from "@/lib/auth/session-token";
import { readOrderAccess } from "@/lib/checkout/order-access";
import { createPaypalOrder } from "@/lib/checkout/queries";

/**
 * `POST /api/payments/paypal/order` - same-origin proxy to
 * `POST /api/v1/payments/paypal/order` (contract 6).
 *
 * Returns only the PayPal order id and the amount the server computed. The
 * PayPal client secret and webhook id stay on the backend.
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
    const result = await createPaypalOrder(
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
        message: "PayPal is unavailable right now. Nothing has been charged.",
        code: "SERVICE_UNAVAILABLE",
        errors: null,
      },
      { status: 503 },
    );
  }
}
