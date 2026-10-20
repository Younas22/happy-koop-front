import { apiGet, apiPost, tryApi, type ApiError } from "@/lib/api/client";
import type {
  CheckoutInitializeRequest,
  CheckoutInitializeResult,
  OrderStatusView,
  PaypalOrderResult,
  ShippingOption,
  StripeIntentResult,
} from "@/lib/types/api";

/**
 * Checkout, order-status and payment calls (contract 5, 6).
 *
 * SERVER ONLY. The browser reaches these through route handlers under
 * `/api/checkout/*` and `/api/payments/*`, so the API origin, the bearer token
 * and the guest access token never touch client code.
 *
 * Nothing here sends a price: the request carries product/variant ids and
 * quantities, and the server computes every amount (contract 1.5).
 */

export type Result<T> = { data: T | null; error: ApiError | null };

const NO_CACHE = { revalidate: false } as const;

/* ------------------------------------------------------------------ *
 * Shipping
 * ------------------------------------------------------------------ */

export interface ShippingOptionsQuery {
  countryCode: string;
  postalCode?: string | null;
  /** Minor units; used only for free-shipping thresholds (contract 5). */
  subtotalAmount?: number | null;
}

/**
 * `[]` is a real answer: the store has configured no rate for that
 * destination, so checkout is blocked for it rather than assuming free
 * shipping.
 */
export function fetchShippingOptions(
  query: ShippingOptionsQuery,
): Promise<Result<ShippingOption[]>> {
  return tryApi(() =>
    apiGet<ShippingOption[]>("/shipping/options", {
      ...NO_CACHE,
      query: {
        country_code: query.countryCode.toUpperCase(),
        postal_code: query.postalCode ?? null,
        subtotal_amount: query.subtotalAmount ?? null,
      },
    }),
  );
}

/* ------------------------------------------------------------------ *
 * Checkout
 * ------------------------------------------------------------------ */

/**
 * `POST /checkout/initialize`.
 *
 * `idempotencyKey` must be a UUIDv4 that stays the same across retries of one
 * attempt. Throws `ApiError` so the caller can branch on
 * `422 CART_CHANGED`, `422 PAYMENT_NOT_CONFIGURED` and `409 CONFLICT`.
 */
export function initializeCheckout(
  body: CheckoutInitializeRequest,
  idempotencyKey: string,
  options: { auth?: boolean } = {},
): Promise<CheckoutInitializeResult> {
  return apiPost<CheckoutInitializeResult>("/checkout/initialize", body, {
    ...NO_CACHE,
    idempotencyKey,
    ...(options.auth ? { auth: true } : {}),
  });
}

/* ------------------------------------------------------------------ *
 * Authoritative order status
 * ------------------------------------------------------------------ */

/**
 * The only source of truth for the return pages (contract 5).
 *
 * `token` is the opaque per-order access token issued at initialize. A signed
 * in customer may omit it and is matched by ownership server-side.
 */
export function fetchOrderStatus(
  orderNumber: string,
  options: { token?: string | null; auth?: boolean } = {},
): Promise<Result<OrderStatusView>> {
  return tryApi(() =>
    apiGet<OrderStatusView>(`/orders/by-number/${encodeURIComponent(orderNumber)}`, {
      ...NO_CACHE,
      query: { token: options.token ?? null },
      ...(options.auth ? { auth: true } : {}),
    }),
  );
}

/* ------------------------------------------------------------------ *
 * Payments
 * ------------------------------------------------------------------ */

export interface PaymentOrderRef {
  orderNumber: string;
  accessToken: string | null;
}

/**
 * `clientSecret` is a single-order, client-side confirmation credential - not
 * an API secret (contract 6). The Stripe secret key and webhook secret never
 * leave the backend.
 */
export function createStripeIntent(
  ref: PaymentOrderRef,
  options: { auth?: boolean } = {},
): Promise<StripeIntentResult> {
  return apiPost<StripeIntentResult>("/payments/stripe/intent", ref, {
    ...NO_CACHE,
    ...(options.auth ? { auth: true } : {}),
  });
}

export function createPaypalOrder(
  ref: PaymentOrderRef,
  options: { auth?: boolean } = {},
): Promise<PaypalOrderResult> {
  return apiPost<PaypalOrderResult>("/payments/paypal/order", ref, {
    ...NO_CACHE,
    ...(options.auth ? { auth: true } : {}),
  });
}

/**
 * Capture is verified server-side against the provider before any status
 * change; a frontend "approved" callback alone never marks an order paid
 * (contract 6). The response is the authoritative order status.
 */
export function capturePaypalOrder(
  ref: PaymentOrderRef & { paypalOrderId: string },
  options: { auth?: boolean } = {},
): Promise<OrderStatusView> {
  return apiPost<OrderStatusView>("/payments/paypal/capture", ref, {
    ...NO_CACHE,
    ...(options.auth ? { auth: true } : {}),
  });
}
