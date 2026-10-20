import { NextResponse } from "next/server";

import { fetchShippingOptions } from "@/lib/checkout/queries";

/**
 * `GET /api/checkout/shipping-options` - same-origin proxy to
 * `GET /api/v1/shipping/options` (contract 5).
 *
 * `[]` is a meaningful answer: the store has no configured rate for that
 * destination, and the client must then block checkout for it rather than
 * assume free shipping. The proxy therefore returns `[]` as a success, not an
 * error.
 *
 * `subtotal_amount` only feeds free-shipping thresholds; the server re-derives
 * the real subtotal when the order is created.
 */

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const countryCode = (url.searchParams.get("country_code") ?? "").trim();

  if (!/^[A-Za-z]{2}$/.test(countryCode)) {
    return NextResponse.json(
      {
        message: "Choose a country to see delivery options.",
        code: "BAD_REQUEST",
        errors: null,
      },
      { status: 400 },
    );
  }

  const postalCode = (url.searchParams.get("postal_code") ?? "").trim() || null;
  const rawSubtotal = url.searchParams.get("subtotal_amount");
  const subtotal = rawSubtotal === null ? null : Number.parseInt(rawSubtotal, 10);

  const { data, error } = await fetchShippingOptions({
    countryCode,
    postalCode,
    subtotalAmount: Number.isSafeInteger(subtotal) && subtotal !== null && subtotal >= 0 ? subtotal : null,
  });

  if (error) {
    return NextResponse.json(
      { message: error.message, code: error.code, errors: error.errors },
      { status: error.status === 0 ? 503 : error.status },
    );
  }

  return NextResponse.json(
    { data: data ?? [] },
    { headers: { "Cache-Control": "no-store" } },
  );
}
