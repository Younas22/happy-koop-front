import type {
  DetailedAvailability,
  Money,
  ProductDetail,
  ProductOption,
  ProductVariant,
} from "@/lib/types/api";

/**
 * Test fixtures ONLY. These never reach the application: no module under
 * `src/lib` or `src/components` imports this file, and there is no mock API
 * layer. They exist so the pure variant/cart/money logic can be exercised.
 */

export function money(amount: number, formatted = `$${(amount / 100).toFixed(2)}`): Money {
  return { amount, currency: "USD", formatted };
}

export function availability(
  overrides: Partial<DetailedAvailability> = {},
): DetailedAvailability {
  return {
    inStock: true,
    state: "in_stock",
    quantity: null,
    policy: "track",
    ...overrides,
  };
}

/** Two options: Color (10 white / 11 charcoal), Size (20 small / 21 large). */
export const COLOR_OPTION: ProductOption = {
  id: 1,
  name: "Color",
  slug: "color",
  values: [
    { id: 10, label: "Matte White", value: "matte-white", swatchHex: "#F3F1EC" },
    { id: 11, label: "Charcoal", value: "charcoal", swatchHex: "#2F2F2F" },
  ],
};

export const SIZE_OPTION: ProductOption = {
  id: 2,
  name: "Size",
  slug: "size",
  values: [
    { id: 20, label: "Small", value: "small", swatchHex: null },
    { id: 21, label: "Large", value: "large", swatchHex: null },
  ],
};

export function variant(
  id: number,
  optionValueIds: number[],
  overrides: Partial<ProductVariant> = {},
): ProductVariant {
  return {
    id,
    sku: `HK-${id}`,
    optionValueIds,
    price: money(2900),
    compareAtPrice: null,
    availability: availability({ quantity: 12 }),
    mediaId: null,
    weightGrams: null,
    isDefault: false,
    ...overrides,
  };
}

/**
 * A product with three of the four possible combinations published.
 * White/Large (10 + 21) is deliberately ABSENT, which is the
 * "combination not available" case the contract requires us to handle.
 */
export function variantProduct(): Pick<
  ProductDetail,
  "options" | "variants" | "price" | "compareAtPrice" | "availability" | "sku"
> {
  return {
    options: [COLOR_OPTION, SIZE_OPTION],
    variants: [
      variant(55, [10, 20], { isDefault: true }),
      variant(56, [11, 20]),
      variant(57, [11, 21], { price: money(3400) }),
    ],
    price: money(2900),
    compareAtPrice: null,
    availability: availability({ quantity: null }),
    sku: "HK-DRIP-01",
  };
}

export function simpleProduct(): Pick<
  ProductDetail,
  "options" | "variants" | "price" | "compareAtPrice" | "availability" | "sku"
> {
  return {
    options: [],
    variants: [],
    price: money(1500),
    compareAtPrice: null,
    availability: availability({ policy: "continue", quantity: null }),
    sku: "HK-SIMPLE",
  };
}
