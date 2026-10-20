import { describe, expect, it } from "vitest";

import {
  NOT_CALCULATED_LABEL,
  discountPercent,
  displayOrNotCalculated,
  formatMoney,
  multiplyMoney,
  parseMajorUnitsToMinor,
  sumMoney,
  toMajorUnitString,
} from "@/lib/money";
import { money } from "@/test/fixtures";

describe("formatMoney", () => {
  it("echoes the server-rendered string without re-deriving it", () => {
    expect(formatMoney({ amount: 2499, currency: "USD", formatted: "$24.99" })).toBe("$24.99");
    // A zero-decimal currency is rendered exactly as the server formatted it.
    expect(formatMoney({ amount: 1200, currency: "JPY", formatted: "¥1,200" })).toBe("¥1,200");
  });
});

describe("displayOrNotCalculated", () => {
  it('returns "Calculated at checkout" for null', () => {
    expect(displayOrNotCalculated(null)).toBe("Calculated at checkout");
    expect(displayOrNotCalculated(null)).toBe(NOT_CALCULATED_LABEL);
  });

  it("never renders null as a zero amount", () => {
    const result = displayOrNotCalculated(null);
    expect(result).not.toContain("0.00");
    expect(result).not.toContain("$0");
  });

  it("returns the formatted string for a real value, including a real zero", () => {
    expect(displayOrNotCalculated(money(0, "$0.00"))).toBe("$0.00");
    expect(displayOrNotCalculated(money(599, "$5.99"))).toBe("$5.99");
  });
});

describe("multiplyMoney", () => {
  it("multiplies integer minor units exactly", () => {
    expect(multiplyMoney(money(2900), 2).amount).toBe(5800);
    // 0.1 + 0.2 style float error is impossible on integers.
    expect(multiplyMoney(money(10), 3).amount).toBe(30);
    expect(multiplyMoney(money(2499), 7).amount).toBe(17493);
  });

  it("keeps the server string only at quantity 1, never deriving one", () => {
    expect(multiplyMoney(money(2900, "$29.00"), 1).formatted).toBe("$29.00");
    expect(multiplyMoney(money(2900, "$29.00"), 3).formatted).toBe("");
  });

  it("rejects a non-integer or negative quantity", () => {
    expect(() => multiplyMoney(money(100), 1.5)).toThrow(TypeError);
    expect(() => multiplyMoney(money(100), -1)).toThrow(TypeError);
  });
});

describe("sumMoney", () => {
  it("sums integer amounts", () => {
    expect(sumMoney([money(100), money(250), money(5)])?.amount).toBe(355);
  });

  it("returns null for an empty list and throws on mixed currencies", () => {
    expect(sumMoney([])).toBeNull();
    expect(() =>
      sumMoney([money(100), { amount: 100, currency: "EUR", formatted: "1,00 €" }]),
    ).toThrow(TypeError);
  });
});

describe("discountPercent", () => {
  it("returns null when there is no compare-at price", () => {
    expect(discountPercent(money(2900), null)).toBeNull();
  });

  it("returns null when the compare-at price is not strictly higher", () => {
    expect(discountPercent(money(2900), money(2900))).toBeNull();
    expect(discountPercent(money(2900), money(2000))).toBeNull();
  });

  it("computes the percentage from the two real amounts", () => {
    expect(discountPercent(money(2000), money(4000))).toBe(50);
    expect(discountPercent(money(2900), money(3500))).toBe(17);
  });

  it("returns null across currencies rather than guessing", () => {
    expect(
      discountPercent(money(2900), { amount: 4000, currency: "EUR", formatted: "40,00 €" }),
    ).toBeNull();
  });
});

describe("parseMajorUnitsToMinor", () => {
  it("converts typed major units without float arithmetic", () => {
    expect(parseMajorUnitsToMinor("24.99", 2)).toBe(2499);
    expect(parseMajorUnitsToMinor("0.1", 2)).toBe(10);
    expect(parseMajorUnitsToMinor("29", 2)).toBe(2900);
    expect(parseMajorUnitsToMinor("1200", 0)).toBe(1200);
  });

  it("truncates extra fraction digits rather than rounding up", () => {
    expect(parseMajorUnitsToMinor("24.999", 2)).toBe(2499);
  });

  it("returns null for anything that is not a plain positive amount", () => {
    expect(parseMajorUnitsToMinor("", 2)).toBeNull();
    expect(parseMajorUnitsToMinor(null, 2)).toBeNull();
    expect(parseMajorUnitsToMinor("-5", 2)).toBeNull();
    expect(parseMajorUnitsToMinor("abc", 2)).toBeNull();
    expect(parseMajorUnitsToMinor("1,99", 2)).toBeNull();
  });
});

describe("toMajorUnitString", () => {
  it("renders a machine-readable amount using the configured exponent", () => {
    expect(toMajorUnitString(money(2900), 2)).toBe("29.00");
    expect(toMajorUnitString(money(5), 2)).toBe("0.05");
    expect(toMajorUnitString({ amount: 1200, currency: "JPY", formatted: "¥1,200" }, 0)).toBe("1200");
  });
});
