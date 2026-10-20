import { NextResponse } from "next/server";
import { z } from "zod";

import { ApiError } from "@/lib/api/client";
import { getSessionToken } from "@/lib/auth/session-token";
import { readOrderAccess } from "@/lib/checkout/order-access";
import { capturePaypalOrder } from "@/lib/checkout/queries";

/**
 * `POST /api/payments/paypal/capture` - same-origin proxy to
 * `POST /api/v1/payments/paypal/capture` (contract 6).
 *
 * The capture is performed and independently verified by the backend (status,
 * amount, currency, order reference) before any payment state changes. The
 * response is the authoritative order status, so the client reports what the
 * server says - a PayPal "approved" callback alone never means paid.
 */

export const dynamic = "force-dynamic";

const schema = z.object({
  orderNumber: z.string().trim().min(1).max(64),
  paypalOrderId: z.string().trim().min(1).max(64),
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
      { message: "The payment could not be identified.", code: "BAD_REQUEST", errors: null },
      { status: 400 },
    );
  }

  const { orderNumber, paypalOrderId } = parsed.data;
  const access = await readOrderAccess(orderNumber);
  const hasSession = (await getSessionToken()) !== null;

  if (!access?.accessToken && !hasSession) {
    return NextResponse.json(
      {
        message: "This payment session has expired. Check your order status before paying again.",
        code: "UNAUTHENTICATED",
        errors: null,
      },
      { status: 401 },
    );
  }

  try {
    const result = await capturePaypalOrder(
      { orderNumber, paypalOrderId, accessToken: access?.accessToken ?? null },
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
        message:
          "We could not confirm this payment. Check your order status before trying again.",
        code: "SERVICE_UNAVAILABLE",
        errors: null,
      },
      { status: 503 },
    );
  }
}
