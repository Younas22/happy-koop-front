"use client";

import * as React from "react";

import { useCartStore } from "@/lib/cart/store";

/**
 * Clears the local cart, but ONLY after the server has confirmed the order
 * left `unpaid`.
 *
 * The decision is made on the server from `GET /orders/by-number/…` and passed
 * in as `confirmed`; this component never inspects a query parameter. If the
 * payment is still unconfirmed or failed, the cart is deliberately left intact
 * so the customer can try again without rebuilding it.
 */
export function ClearCartOnConfirmation({ confirmed }: { confirmed: boolean }) {
  const clear = useCartStore((state) => state.clear);
  const lines = useCartStore((state) => state.lines);
  const hydrated = useCartStore((state) => state.hydrated);

  React.useEffect(() => {
    if (!confirmed || !hydrated) return;
    if (lines.length === 0) return;
    clear();
  }, [confirmed, hydrated, lines.length, clear]);

  return null;
}
