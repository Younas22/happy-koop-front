import { cookies } from "next/headers";

/**
 * Guest order access tokens.
 *
 * `checkout/initialize` returns an opaque per-order `accessToken` that guards
 * guest reads of that order (contract 12, decision 8). It is a credential, so
 * it is kept in an HttpOnly cookie owned by this app rather than handed to the
 * page or put in a URL we generate: the browser gets only the order number.
 *
 * The payment route handlers and the checkout return pages read it back
 * server-side. A `?token=` query parameter is still honoured where one is
 * present - the contract defines that interface and a provider may bounce the
 * customer through a link that carries it - but nothing here creates such a
 * link.
 *
 * SERVER ONLY.
 */

export const ORDER_ACCESS_COOKIE = "hk_order";

/** One hour longer than the 60-minute checkout window. */
const MAX_AGE_SECONDS = 2 * 60 * 60;

export interface OrderAccess {
  orderNumber: string;
  accessToken: string | null;
}

export function orderAccessCookieOptions() {
  return {
    httpOnly: true as const,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  };
}

export function serializeOrderAccess(access: OrderAccess): string {
  return JSON.stringify({ o: access.orderNumber, t: access.accessToken });
}

function parseOrderAccess(raw: string | undefined): OrderAccess | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const record = parsed as { o?: unknown; t?: unknown };
    if (typeof record.o !== "string" || record.o.length === 0) return null;
    return {
      orderNumber: record.o,
      accessToken: typeof record.t === "string" && record.t.length > 0 ? record.t : null,
    };
  } catch {
    return null;
  }
}

/** The stored access record, if it is for the order being asked about. */
export async function readOrderAccess(orderNumber: string): Promise<OrderAccess | null> {
  try {
    const store = await cookies();
    const access = parseOrderAccess(store.get(ORDER_ACCESS_COOKIE)?.value);
    if (!access) return null;
    return access.orderNumber === orderNumber ? access : null;
  } catch {
    // Outside a request scope there is no cookie to read.
    return null;
  }
}

/**
 * Resolves the token to use for an order read: the one in the cookie,
 * otherwise an explicit `?token=` value. Returns `null` for a signed-in
 * customer reading their own order, where ownership is enough.
 */
export async function resolveOrderToken(
  orderNumber: string,
  queryToken: string | null,
): Promise<string | null> {
  const stored = await readOrderAccess(orderNumber);
  if (stored?.accessToken) return stored.accessToken;
  const candidate = (queryToken ?? "").trim();
  return candidate.length > 0 ? candidate : null;
}
