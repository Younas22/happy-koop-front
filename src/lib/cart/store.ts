"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import {
  CART_STORAGE_KEY,
  MAX_CART_LINES,
  MAX_QUANTITY,
  MIN_QUANTITY,
} from "@/lib/cart/constants";
import type { CartLineInput, CartValidation } from "@/lib/types/api";

/**
 * Client-held, server-validated cart (api-contract 5).
 *
 * PERSISTED: only `{ productId, variantId, quantity }` lines. No price, no
 * total, no availability and no name is ever written to localStorage as
 * authoritative data - the server is the only source of those. The last
 * validation result is kept in memory for rendering and is replaced on every
 * `POST /cart/validate`.
 */

export { CART_STORAGE_KEY, MAX_CART_LINES, MAX_QUANTITY, MIN_QUANTITY };

export function lineKey(productId: number, variantId: number | null): string {
  return `${productId}:${variantId ?? ""}`;
}

export function clampQuantity(quantity: number): number {
  if (!Number.isFinite(quantity)) return MIN_QUANTITY;
  const whole = Math.trunc(quantity);
  if (whole < MIN_QUANTITY) return MIN_QUANTITY;
  if (whole > MAX_QUANTITY) return MAX_QUANTITY;
  return whole;
}

/** Pure reducer for adding a line; exported so the maths can be unit-tested. */
export function addLine(
  lines: readonly CartLineInput[],
  productId: number,
  variantId: number | null,
  quantity: number,
): CartLineInput[] {
  const key = lineKey(productId, variantId);
  const requested = clampQuantity(quantity);
  const existing = lines.find((line) => lineKey(line.productId, line.variantId) === key);

  if (existing) {
    return lines.map((line) =>
      lineKey(line.productId, line.variantId) === key
        ? { ...line, quantity: clampQuantity(line.quantity + requested) }
        : line,
    );
  }

  if (lines.length >= MAX_CART_LINES) return [...lines];
  return [...lines, { productId, variantId, quantity: requested }];
}

/** Pure reducer for a quantity change. Quantity <= 0 removes the line. */
export function setLineQuantity(
  lines: readonly CartLineInput[],
  productId: number,
  variantId: number | null,
  quantity: number,
): CartLineInput[] {
  const key = lineKey(productId, variantId);
  if (Math.trunc(quantity) < MIN_QUANTITY) {
    return lines.filter((line) => lineKey(line.productId, line.variantId) !== key);
  }
  return lines.map((line) =>
    lineKey(line.productId, line.variantId) === key
      ? { ...line, quantity: clampQuantity(quantity) }
      : line,
  );
}

export function removeLine(
  lines: readonly CartLineInput[],
  productId: number,
  variantId: number | null,
): CartLineInput[] {
  const key = lineKey(productId, variantId);
  return lines.filter((line) => lineKey(line.productId, line.variantId) !== key);
}

/** Total units, used for the header badge. Not a monetary value. */
export function totalUnits(lines: readonly CartLineInput[]): number {
  return lines.reduce((sum, line) => sum + line.quantity, 0);
}

export interface CartState {
  /** The only persisted data. */
  lines: CartLineInput[];
  /** Last server response. In memory only; never trusted after a reload. */
  validation: CartValidation | null;
  /** False until the persisted state has been read, to avoid SSR mismatch. */
  hydrated: boolean;
  /** True while a server validation is in flight. */
  validating: boolean;
  /** Human-readable message from the last failed validation, if any. */
  error: string | null;

  addItem: (productId: number, variantId: number | null, quantity?: number) => void;
  updateQuantity: (productId: number, variantId: number | null, quantity: number) => void;
  removeItem: (productId: number, variantId: number | null) => void;
  clear: () => void;
  /**
   * Replaces local state with the server's authoritative item list. Called
   * after every `POST /cart/validate` - the frontend MUST adopt the server's
   * items (contract 5).
   */
  replaceFromServer: (validation: CartValidation) => void;
  setValidating: (validating: boolean) => void;
  setError: (error: string | null) => void;
  setHydrated: () => void;
}

/**
 * localStorage is absent on the server and can throw in a private window or
 * with site data blocked, so every access is guarded and silently degrades to
 * an in-memory cart rather than breaking the page.
 */
const safeStorage = createJSONStorage<Pick<CartState, "lines">>(() => ({
  getItem: (name) => {
    try {
      return typeof window === "undefined" ? null : window.localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      if (typeof window !== "undefined") window.localStorage.setItem(name, value);
    } catch {
      // Storage unavailable: the cart stays in memory for this session.
    }
  },
  removeItem: (name) => {
    try {
      if (typeof window !== "undefined") window.localStorage.removeItem(name);
    } catch {
      // Nothing to clean up if storage is unavailable.
    }
  },
}));

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      validation: null,
      hydrated: false,
      validating: false,
      error: null,

      addItem: (productId, variantId, quantity = 1) =>
        set((state) => ({ lines: addLine(state.lines, productId, variantId, quantity) })),

      updateQuantity: (productId, variantId, quantity) =>
        set((state) => ({ lines: setLineQuantity(state.lines, productId, variantId, quantity) })),

      removeItem: (productId, variantId) =>
        set((state) => ({ lines: removeLine(state.lines, productId, variantId) })),

      clear: () => set({ lines: [], validation: null, error: null }),

      replaceFromServer: (validation) =>
        set({
          validation,
          lines: validation.items.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
          })),
          error: null,
        }),

      setValidating: (validating) => set({ validating }),
      setError: (error) => set({ error }),
      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: CART_STORAGE_KEY,
      storage: safeStorage,
      // Prices, totals and availability are deliberately excluded.
      partialize: (state) => ({ lines: state.lines }),
      version: 1,
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    },
  ),
);

/** Selector for the header badge. Returns 0 before hydration. */
export function selectCartCount(state: CartState): number {
  return state.hydrated ? totalUnits(state.lines) : 0;
}
