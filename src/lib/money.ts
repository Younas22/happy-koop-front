import type { Money } from "@/lib/types/api";

/**
 * Money helpers.
 *
 * Rules (contract 1.5):
 *  - `amount` is integer minor units. Floats are never used for money.
 *  - `formatted` is server-rendered with the store locale. Display it; never
 *    re-derive it and never parse it.
 *  - `null` money means "not yet determined" and must never render as $0.00.
 */

/** The single string shown when a monetary value is not yet determined. */
export const NOT_CALCULATED_LABEL = "Calculated at checkout";

/**
 * The only approved way to display a monetary value: echo the server string.
 */
export function formatMoney(m: Money): string {
  return m.formatted;
}

/**
 * Display helper for nullable money. `null` is "not yet determined"
 * (shipping before a method is chosen, tax before a provider is configured),
 * so it renders as "Calculated at checkout" - NEVER as a zero amount.
 */
export function displayOrNotCalculated(m: Money | null): string {
  return m === null ? NOT_CALCULATED_LABEL : m.formatted;
}

/**
 * Integer-only multiply, for optimistic line-total previews while a server
 * validation is in flight.
 *
 * `formatted` is intentionally NOT recomputed - the server owns display
 * strings. The returned object carries the source `formatted` only when the
 * quantity is 1; otherwise it is empty so a caller cannot mistake a derived
 * amount for a server-rendered price.
 */
export function multiplyMoney(m: Money, quantity: number): Money {
  if (!Number.isInteger(quantity) || quantity < 0) {
    throw new TypeError("multiplyMoney: quantity must be a non-negative integer");
  }
  return {
    amount: m.amount * quantity,
    currency: m.currency,
    formatted: quantity === 1 ? m.formatted : "",
  };
}

/** Integer-only sum. All operands must share a currency. */
export function sumMoney(values: readonly Money[]): Money | null {
  if (values.length === 0) return null;
  const currency = values[0].currency;
  let amount = 0;
  for (const value of values) {
    if (value.currency !== currency) {
      throw new TypeError("sumMoney: cannot sum mixed currencies");
    }
    amount += value.amount;
  }
  return { amount, currency, formatted: "" };
}

/**
 * Discount percentage, computed ONLY from two real server amounts.
 * Returns `null` unless `compareAtPrice` is genuinely higher, so no component
 * can display an invented "was" price or a fabricated saving.
 */
export function discountPercent(price: Money, compareAtPrice: Money | null): number | null {
  if (compareAtPrice === null) return null;
  if (compareAtPrice.currency !== price.currency) return null;
  if (compareAtPrice.amount <= price.amount) return null;
  if (compareAtPrice.amount <= 0) return null;
  const pct = Math.round(((compareAtPrice.amount - price.amount) / compareAtPrice.amount) * 100);
  return pct > 0 ? pct : null;
}

/**
 * Major-unit text ("24.99") -> integer minor units (2499), by string math so
 * no float ever touches a monetary value. Used for the price filter inputs,
 * since `min_price`/`max_price` are minor units (contract 4).
 * Returns `null` for anything that is not a plain positive amount.
 */
export function parseMajorUnitsToMinor(
  input: string | null | undefined,
  minorUnitExponent: number,
): number | null {
  const raw = (input ?? "").trim();
  if (!raw) return null;
  if (!/^\d+(\.\d+)?$/.test(raw)) return null;

  const exponent = Number.isInteger(minorUnitExponent) && minorUnitExponent >= 0 ? minorUnitExponent : 2;
  const [wholePart, fractionPart = ""] = raw.split(".");
  if (exponent === 0) {
    const value = Number.parseInt(wholePart, 10);
    return Number.isSafeInteger(value) ? value : null;
  }

  const padded = (fractionPart + "0".repeat(exponent)).slice(0, exponent);
  const value = Number.parseInt(`${wholePart}${padded}`, 10);
  return Number.isSafeInteger(value) ? value : null;
}

/**
 * Minor units -> major units, using the exponent from runtime config.
 * Used only where a numeric value is required by a machine-readable format
 * (e.g. JSON-LD `price`), never for human display.
 */
export function toMajorUnitString(m: Money, minorUnitExponent: number): string {
  const exponent = Number.isInteger(minorUnitExponent) && minorUnitExponent >= 0 ? minorUnitExponent : 2;
  if (exponent === 0) return String(m.amount);
  const negative = m.amount < 0;
  const digits = String(Math.abs(m.amount)).padStart(exponent + 1, "0");
  const whole = digits.slice(0, digits.length - exponent);
  const fraction = digits.slice(digits.length - exponent);
  return `${negative ? "-" : ""}${whole}.${fraction}`;
}
