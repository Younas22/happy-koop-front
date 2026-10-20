import { NextResponse } from "next/server";
import { z } from "zod";

import { ApiError } from "@/lib/api/client";
import { getSessionToken } from "@/lib/auth/session-token";
import { MAX_CART_LINES, MAX_QUANTITY, MIN_QUANTITY } from "@/lib/cart/constants";
import { isUuidV4, newIdempotencyKey } from "@/lib/checkout/idempotency";
import {
  ORDER_ACCESS_COOKIE,
  orderAccessCookieOptions,
  serializeOrderAccess,
} from "@/lib/checkout/order-access";
import { initializeCheckout } from "@/lib/checkout/queries";
import type { CheckoutInitializeRequest } from "@/lib/types/api";

/**
 * `POST /api/checkout/initialize` - same-origin proxy to Laravel
 * `POST /api/v1/checkout/initialize` (contract 5).
 *
 * IDEMPOTENCY: the upstream endpoint requires an `Idempotency-Key` header
 * holding a UUIDv4. The client generates one per checkout attempt and keeps it
 * in component state, so a retry after a timeout reuses the same key and
 * returns the SAME order (200) instead of creating a duplicate. This handler
 * accepts that key only when it really is a UUIDv4 and otherwise mints one
 * with `crypto.randomUUID()`, so a malformed or missing header can never reach
 * the API as a 400.
 *
 * ACCESS TOKEN: the opaque guest token in the response is stripped from the
 * body and stored in an HttpOnly cookie instead, so the page never holds the
 * credential that guards the order.
 *
 * No price is forwarded: the schema keeps ids and quantities only, and the
 * server computes every amount.
 */

export const dynamic = "force-dynamic";

const addressSchema = z.object({
  firstName: z.string().trim().min(1).max(120),
  lastName: z.string().trim().min(1).max(120),
  company: z.string().trim().max(160).nullable().default(null),
  line1: z.string().trim().min(1).max(255),
  line2: z.string().trim().max(255).nullable().default(null),
  city: z.string().trim().min(1).max(120),
  region: z.string().trim().max(120).nullable().default(null),
  postalCode: z.string().trim().min(1).max(32),
  countryCode: z
    .string()
    .trim()
    .regex(/^[A-Za-z]{2}$/)
    .transform((value) => value.toUpperCase()),
  phone: z.string().trim().max(32).nullable().default(null),
});

const bodySchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.number().int().positive(),
        variantId: z.number().int().positive().nullable(),
        quantity: z.number().int().min(MIN_QUANTITY).max(MAX_QUANTITY),
      }),
    )
    .min(1)
    .max(MAX_CART_LINES),
  cartHash: z.string().trim().min(1).max(128),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(32).nullable().default(null),
  shippingAddress: addressSchema,
  billingAddress: addressSchema.nullable().default(null),
  shippingMethodId: z.string().trim().min(1).max(64),
  couponCode: z.string().trim().max(64).nullable().default(null),
  paymentProvider: z.enum(["stripe", "paypal"]),
  customerNote: z.string().trim().max(2000).nullable().default(null),
  acceptsMarketing: z.boolean().default(false),
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

  const parsed = bodySchema.safeParse(payload);
  if (!parsed.success) {
    const errors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".") || "form";
      errors[key] = [...(errors[key] ?? []), issue.message];
    }
    return NextResponse.json(
      { message: "Please check the highlighted fields.", code: "VALIDATION_FAILED", errors },
      { status: 422 },
    );
  }

  const headerKey = request.headers.get("Idempotency-Key");
  const idempotencyKey = isUuidV4(headerKey) ? (headerKey as string) : newIdempotencyKey();

  // A signed-in customer's order is attached to their account; a guest order
  // is guarded by the access token instead.
  const hasSession = (await getSessionToken()) !== null;

  try {
    const result = await initializeCheckout(
      parsed.data as CheckoutInitializeRequest,
      idempotencyKey,
      { auth: hasSession },
    );

    const { accessToken, ...order } = result.order;

    const response = NextResponse.json(
      {
        data: {
          // `accessToken` is deliberately absent from the body.
          order,
          paymentAttempt: result.paymentAttempt,
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );

    response.cookies.set(
      ORDER_ACCESS_COOKIE,
      serializeOrderAccess({ orderNumber: order.orderNumber, accessToken: accessToken ?? null }),
      orderAccessCookieOptions(),
    );

    return response;
  } catch (error) {
    if (error instanceof ApiError) {
      // 422 CART_CHANGED, 422 PAYMENT_NOT_CONFIGURED and 409 CONFLICT are
      // passed through untouched so the client can branch on `code`.
      return NextResponse.json(
        { message: error.message, code: error.code, errors: error.errors },
        { status: error.status === 0 ? 503 : error.status },
      );
    }
    return NextResponse.json(
      {
        message: "Checkout is unavailable right now. Nothing has been charged.",
        code: "SERVICE_UNAVAILABLE",
        errors: null,
      },
      { status: 503 },
    );
  }
}
