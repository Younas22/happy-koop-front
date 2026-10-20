import { describe, expect, it } from "vitest";

import {
  defaultSelection,
  isSelectionComplete,
  maxSelectableQuantity,
  resolvePurchaseState,
  resolveVariant,
  selectableValueIds,
  variantLabel,
} from "@/lib/product/variants";
import {
  COLOR_OPTION,
  SIZE_OPTION,
  availability,
  simpleProduct,
  variantProduct,
} from "@/test/fixtures";

describe("resolveVariant - matching by the SET of optionValueIds", () => {
  const product = variantProduct();

  it("matches regardless of the order the values were chosen in", () => {
    const forward = resolveVariant(product.variants, product.options, { 1: 11, 2: 21 });
    const reverse = resolveVariant(product.variants, product.options, { 2: 21, 1: 11 });

    expect(forward?.id).toBe(57);
    expect(reverse?.id).toBe(57);
  });

  it("returns null while the selection is incomplete", () => {
    expect(resolveVariant(product.variants, product.options, { 1: 10 })).toBeNull();
    expect(isSelectionComplete(product.options, { 1: 10 })).toBe(false);
  });

  it("returns null for a complete combination that is not published", () => {
    // White (10) + Large (21) exists in the option lists but in no variant.
    const selection = { 1: 10, 2: 21 };

    expect(isSelectionComplete(product.options, selection)).toBe(true);
    expect(resolveVariant(product.variants, product.options, selection)).toBeNull();
  });

  it("does not synthesize variants from the cartesian product", () => {
    // 2 colours x 2 sizes = 4 combinations, but only 3 variants exist.
    const combinations = [
      { 1: 10, 2: 20 },
      { 1: 10, 2: 21 },
      { 1: 11, 2: 20 },
      { 1: 11, 2: 21 },
    ];
    const resolved = combinations.map((selection) =>
      resolveVariant(product.variants, product.options, selection),
    );

    expect(resolved.filter(Boolean)).toHaveLength(3);
    expect(resolved[1]).toBeNull();
  });
});

describe("selectableValueIds", () => {
  const product = variantProduct();

  it("only offers sizes that exist for the chosen colour", () => {
    const whiteSizes = selectableValueIds(product.variants, SIZE_OPTION.id, SIZE_OPTION, { 1: 10 });
    expect([...whiteSizes]).toEqual([20]);

    const charcoalSizes = selectableValueIds(product.variants, SIZE_OPTION.id, SIZE_OPTION, {
      1: 11,
    });
    expect([...charcoalSizes].sort()).toEqual([20, 21]);
  });

  it("offers every published value when nothing else is chosen", () => {
    const colors = selectableValueIds(product.variants, COLOR_OPTION.id, COLOR_OPTION, {});
    expect([...colors].sort()).toEqual([10, 11]);
  });
});

describe("resolvePurchaseState", () => {
  it("flags an unavailable combination and blocks Add to Cart", () => {
    const product = variantProduct();
    const state = resolvePurchaseState(product, { 1: 10, 2: 21 });

    expect(state.variant).toBeNull();
    expect(state.selectionComplete).toBe(true);
    expect(state.combinationUnavailable).toBe(true);
    expect(state.canAddToCart).toBe(false);
  });

  it("blocks Add to Cart while the selection is incomplete, without claiming unavailability", () => {
    const product = variantProduct();
    const state = resolvePurchaseState(product, { 1: 11 });

    expect(state.canAddToCart).toBe(false);
    expect(state.combinationUnavailable).toBe(false);
  });

  it("uses the resolved variant's own server price, not the product price", () => {
    const product = variantProduct();
    const state = resolvePurchaseState(product, { 1: 11, 2: 21 });

    expect(state.variant?.id).toBe(57);
    expect(state.price.amount).toBe(3400);
    expect(state.canAddToCart).toBe(true);
  });

  it("uses the product-level price and availability for a simple product", () => {
    const product = simpleProduct();
    const state = resolvePurchaseState(product, {});

    expect(state.variant).toBeNull();
    expect(state.price.amount).toBe(1500);
    expect(state.selectionComplete).toBe(true);
    expect(state.canAddToCart).toBe(true);
  });

  it("blocks Add to Cart for an out-of-stock variant", () => {
    const product = variantProduct();
    product.variants = product.variants.map((candidate) =>
      candidate.id === 57
        ? {
            ...candidate,
            availability: availability({ inStock: false, state: "out_of_stock", quantity: 0 }),
          }
        : candidate,
    );

    const state = resolvePurchaseState(product, { 1: 11, 2: 21 });
    expect(state.canAddToCart).toBe(false);
    expect(state.combinationUnavailable).toBe(false);
  });
});

describe("defaultSelection", () => {
  it("starts on the isDefault variant", () => {
    const product = variantProduct();
    expect(defaultSelection(product)).toEqual({ 1: 10, 2: 20 });
  });

  it("is empty for a product with no options", () => {
    expect(defaultSelection(simpleProduct())).toEqual({});
  });
});

describe("variantLabel", () => {
  it("joins the chosen option labels in option order", () => {
    expect(variantLabel([COLOR_OPTION, SIZE_OPTION], { optionValueIds: [21, 11] })).toBe(
      "Charcoal / Large",
    );
  });

  it("returns null when no option value matches", () => {
    expect(variantLabel([COLOR_OPTION], { optionValueIds: [999] })).toBeNull();
  });
});

describe("maxSelectableQuantity", () => {
  it("returns the tracked quantity", () => {
    expect(maxSelectableQuantity(availability({ policy: "track", quantity: 7 }))).toBe(7);
  });

  it("returns null when stock is not tracked or not published", () => {
    expect(maxSelectableQuantity(availability({ policy: "continue", quantity: 7 }))).toBeNull();
    expect(maxSelectableQuantity(availability({ policy: "track", quantity: null }))).toBeNull();
  });
});
