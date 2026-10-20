/**
 * Cart limits from api-contract 5. Kept in a framework-neutral module so both
 * the client store and server route handlers can validate against the same
 * numbers.
 */

export const CART_STORAGE_KEY = "hk_cart_v1";

/** Max 50 distinct lines (contract 5). */
export const MAX_CART_LINES = 50;

/** `quantity` is 1..99 integer (contract 5). */
export const MIN_QUANTITY = 1;
export const MAX_QUANTITY = 99;
