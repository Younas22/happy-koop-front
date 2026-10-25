"use client";

import * as React from "react";

import { useMessages } from "@/i18n/client";
import { useCartStore } from "@/lib/cart/store";
import type { CartLineInput, CartValidation } from "@/lib/types/api";

/**
 * Runs `POST /api/cart/validate` (which proxies Laravel
 * `POST /api/v1/cart/validate`) and REPLACES local state with the server
 * response.
 *
 * The server is the only source of prices, availability and totals, so the
 * local lines are overwritten with `validation.items` on every success - that
 * is how `removedItems` and `adjustments` take effect.
 */
export interface UseCartValidationResult {
  validation: CartValidation | null;
  validating: boolean;
  error: string | null;
  revalidate: () => void;
}

export function useCartValidation(options: { enabled?: boolean } = {}): UseCartValidationResult {
  const enabled = options.enabled ?? true;
  // Error text in the page's language. The dictionary object is stable for
  // the life of the page, so listing it as a dependency re-runs nothing.
  const t = useMessages().cartDrawer;

  const lines = useCartStore((state) => state.lines);
  const hydrated = useCartStore((state) => state.hydrated);
  const validation = useCartStore((state) => state.validation);
  const validating = useCartStore((state) => state.validating);
  const error = useCartStore((state) => state.error);
  const replaceFromServer = useCartStore((state) => state.replaceFromServer);
  const setValidating = useCartStore((state) => state.setValidating);
  const setError = useCartStore((state) => state.setError);

  /**
   * A stable fingerprint of the lines.
   *
   * `replaceFromServer` builds a fresh array on every response, so depending
   * on the array identity would validate in a loop. The fingerprint changes
   * only when the actual ids or quantities change, and the effect parses it
   * back into the request body - no ref is read during render.
   */
  const fingerprint = React.useMemo(
    () => lines.map((line) => `${line.productId}:${line.variantId ?? ""}:${line.quantity}`).join("|"),
    [lines],
  );

  const [nonce, setNonce] = React.useState(0);
  const revalidate = React.useCallback(() => setNonce((value) => value + 1), []);

  React.useEffect(() => {
    if (!enabled || !hydrated) return;

    const current: CartLineInput[] = fingerprint
      ? fingerprint.split("|").map((part) => {
          const [productId, variantId, quantity] = part.split(":");
          return {
            productId: Number(productId),
            variantId: variantId === "" ? null : Number(variantId),
            quantity: Number(quantity),
          };
        })
      : [];

    if (current.length === 0) {
      setValidating(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    let cancelled = false;

    setValidating(true);

    (async () => {
      try {
        const response = await fetch("/api/cart/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            items: current,
            couponCode: null,
            countryCode: null,
            postalCode: null,
          }),
          signal: controller.signal,
        });

        const payload: unknown = await response.json().catch(() => null);

        if (cancelled) return;

        if (!response.ok) {
          const message =
            payload && typeof payload === "object" && "message" in payload
              ? String((payload as { message: unknown }).message)
              : t.checkFailed;
          setError(message);
          return;
        }

        if (payload && typeof payload === "object" && "data" in payload) {
          replaceFromServer((payload as { data: CartValidation }).data);
        } else {
          setError(t.unexpected);
        }
      } catch (fetchError) {
        if (cancelled) return;
        if (fetchError instanceof DOMException && fetchError.name === "AbortError") return;
        setError(t.unreachable);
      } finally {
        if (!cancelled) setValidating(false);
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [enabled, hydrated, fingerprint, nonce, replaceFromServer, setError, setValidating, t]);

  return { validation, validating, error, revalidate };
}
