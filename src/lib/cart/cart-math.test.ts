import { describe, expect, it } from "vitest";

import {
  MAX_CART_LINES,
  MAX_QUANTITY,
  MIN_QUANTITY,
} from "@/lib/cart/constants";
import {
  addLine,
  clampQuantity,
  lineKey,
  removeLine,
  setLineQuantity,
  totalUnits,
} from "@/lib/cart/store";
import type { CartLineInput } from "@/lib/types/api";

const line = (productId: number, variantId: number | null, quantity: number): CartLineInput => ({
  productId,
  variantId,
  quantity,
});

describe("clampQuantity", () => {
  it("keeps the quantity inside the contract range of 1..99", () => {
    expect(clampQuantity(0)).toBe(MIN_QUANTITY);
    expect(clampQuantity(-5)).toBe(MIN_QUANTITY);
    expect(clampQuantity(1)).toBe(1);
    expect(clampQuantity(99)).toBe(MAX_QUANTITY);
    expect(clampQuantity(500)).toBe(MAX_QUANTITY);
  });

  it("truncates fractions and rejects non-finite input", () => {
    expect(clampQuantity(2.9)).toBe(2);
    expect(clampQuantity(Number.NaN)).toBe(MIN_QUANTITY);
    expect(clampQuantity(Number.POSITIVE_INFINITY)).toBe(MIN_QUANTITY);
  });
});

describe("lineKey", () => {
  it("distinguishes a simple product from a variant of it", () => {
    expect(lineKey(101, null)).toBe("101:");
    expect(lineKey(101, 55)).toBe("101:55");
    expect(lineKey(101, null)).not.toBe(lineKey(101, 55));
  });
});

describe("addLine", () => {
  it("adds a new line", () => {
    expect(addLine([], 101, 55, 2)).toEqual([line(101, 55, 2)]);
  });

  it("sums quantities for the same product/variant pair", () => {
    const result = addLine([line(101, 55, 2)], 101, 55, 3);
    expect(result).toEqual([line(101, 55, 5)]);
  });

  it("keeps variants of the same product as separate lines", () => {
    const result = addLine([line(101, 55, 1)], 101, 56, 1);
    expect(result).toHaveLength(2);
  });

  it("clamps a summed quantity to the maximum rather than overflowing", () => {
    const result = addLine([line(101, 55, 98)], 101, 55, 10);
    expect(result[0].quantity).toBe(MAX_QUANTITY);
  });

  it("refuses to exceed the 50 distinct line limit", () => {
    const full = Array.from({ length: MAX_CART_LINES }, (_, index) => line(index + 1, null, 1));
    const result = addLine(full, 999, null, 1);
    expect(result).toHaveLength(MAX_CART_LINES);
  });

  it("does not mutate the input array", () => {
    const original = [line(101, 55, 1)];
    addLine(original, 101, 55, 1);
    expect(original[0].quantity).toBe(1);
  });
});

describe("setLineQuantity", () => {
  it("sets a clamped quantity on the matching line only", () => {
    const result = setLineQuantity([line(101, 55, 1), line(102, null, 4)], 101, 55, 7);
    expect(result).toEqual([line(101, 55, 7), line(102, null, 4)]);
  });

  it("removes the line when the quantity drops below one", () => {
    expect(setLineQuantity([line(101, 55, 1)], 101, 55, 0)).toEqual([]);
  });

  it("clamps above the maximum", () => {
    const result = setLineQuantity([line(101, 55, 1)], 101, 55, 1000);
    expect(result[0].quantity).toBe(MAX_QUANTITY);
  });
});

describe("removeLine", () => {
  it("removes only the exact product/variant pair", () => {
    const result = removeLine([line(101, 55, 1), line(101, 56, 1)], 101, 55);
    expect(result).toEqual([line(101, 56, 1)]);
  });
});

describe("totalUnits", () => {
  it("sums quantities across lines", () => {
    expect(totalUnits([line(101, 55, 2), line(102, null, 3)])).toBe(5);
  });

  it("is zero for an empty cart", () => {
    expect(totalUnits([])).toBe(0);
  });
});
