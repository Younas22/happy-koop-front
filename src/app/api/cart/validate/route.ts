import { NextResponse } from "next/server";
import { z } from "zod";

import { ApiError, apiPost } from "@/lib/api/client";
import { MAX_CART_LINES, MAX_QUANTITY, MIN_QUANTITY } from "@/lib/cart/constants";
import type { CartValidation } from "@/lib/types/api";

/**
 * `POST /api/cart/validate` - same-origin proxy to Laravel
 * `POST /api/v1/cart/validate`.
 *
 * The browser cannot call Laravel directly: the API base URL is resolved from
 * the server-validated runtime config, and keeping the call server-side means
 * no API origin or allowlist logic ships to the client.
 *
 * The request carries ONLY product/variant ids and quantities. Any price-like
 * field would be ignored by the backend anyway (contract 1.5); the schema
 * below strips unknown keys so none is forwarded.
 */

export const dynamic = "force-dynamic";

const requestSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.number().int().positive(),
        variantId: z.number().int().positive().nullable(),
        quantity: z.number().int().min(MIN_QUANTITY).max(MAX_QUANTITY),
      }),
    )
    .max(MAX_CART_LINES),
  couponCode: z.string().trim().max(64).nullable().default(null),
  countryCode: z
    .string()
    .trim()
    .regex(/^[A-Za-z]{2}$/)
    .nullable()
    .default(null),
  postalCode: z.string().trim().max(32).nullable().default(null),
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

  const parsed = requestSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "The cart could not be read.", code: "BAD_REQUEST", errors: null },
      { status: 400 },
    );
  }

  try {
    const data = await apiPost<CartValidation>("/cart/validate", parsed.data, { revalidate: false });
    return NextResponse.json({ data }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { message: error.message, code: error.code, errors: error.errors },
        { status: error.status === 0 ? 503 : error.status },
      );
    }
    return NextResponse.json(
      { message: "We could not check your cart right now.", code: "SERVICE_UNAVAILABLE", errors: null },
      { status: 503 },
    );
  }
}
