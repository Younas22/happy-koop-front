import type {
  DetailedAvailability,
  Money,
  ProductDetail,
  ProductOption,
  ProductVariant,
} from "@/lib/types/api";

/**
 * Variant resolution, per the "Variant selection contract" in api-contract 4.
 *
 * A variant is identified by the SET of `optionValueIds` - one value per
 * option, order-insensitive. The frontend resolves the selected variant by
 * matching that set against `product.variants`.
 *
 * It must NOT synthesize variants from the cartesian product of options: a
 * combination that is not present in `variants` is unavailable, and the
 * Add-to-Cart control is disabled with an explicit message.
 */

/** Selection as optionId -> optionValueId. Missing key means "not chosen". */
export type VariantSelection = Record<number, number | undefined>;

function sameIdSet(a: readonly number[], b: readonly number[]): boolean {
  if (a.length !== b.length) return false;
  const seen = new Set(a);
  if (seen.size !== a.length) {
    // Defensive: a malformed variant with duplicate ids never matches.
    return false;
  }
  for (const id of b) {
    if (!seen.has(id)) return false;
  }
  return true;
}

/** The chosen value ids, in no particular order. */
export function selectedValueIds(selection: VariantSelection): number[] {
  return Object.values(selection).filter((id): id is number => typeof id === "number");
}

/** True when every option has a chosen value. */
export function isSelectionComplete(
  options: readonly ProductOption[],
  selection: VariantSelection,
): boolean {
  if (options.length === 0) return true;
  return options.every((option) => typeof selection[option.id] === "number");
}

/**
 * Resolves the variant whose `optionValueIds` set equals the selection.
 * Returns `null` when the selection is incomplete OR when the combination does
 * not exist - those two cases are distinguished by `isSelectionComplete`.
 */
export function resolveVariant(
  variants: readonly ProductVariant[],
  options: readonly ProductOption[],
  selection: VariantSelection,
): ProductVariant | null {
  if (variants.length === 0) return null;
  if (!isSelectionComplete(options, selection)) return null;
  const chosen = selectedValueIds(selection);
  return variants.find((variant) => sameIdSet(variant.optionValueIds, chosen)) ?? null;
}

/**
 * Value ids for `optionId` that appear in at least one real variant which is
 * also consistent with the rest of the current selection.
 *
 * This is derived from the actual `variants` list, so it can only ever narrow
 * the choices the backend published - it never invents a combination.
 */
export function selectableValueIds(
  variants: readonly ProductVariant[],
  optionId: number,
  option: ProductOption,
  selection: VariantSelection,
): Set<number> {
  const result = new Set<number>();
  const ownValueIds = new Set(option.values.map((value) => value.id));
  const otherChosen = Object.entries(selection)
    .filter(([key, value]) => Number(key) !== optionId && typeof value === "number")
    .map(([, value]) => value as number);

  for (const variant of variants) {
    const ids = new Set(variant.optionValueIds);
    const matchesRest = otherChosen.every((id) => ids.has(id));
    if (!matchesRest) continue;
    for (const id of variant.optionValueIds) {
      if (ownValueIds.has(id)) result.add(id);
    }
  }
  return result;
}

/**
 * The initial selection: the `isDefault` variant, else the first in-stock
 * variant, else the first variant. Empty for a simple product.
 */
export function defaultSelection(product: Pick<ProductDetail, "options" | "variants">): VariantSelection {
  if (product.variants.length === 0 || product.options.length === 0) return {};

  const preferred =
    product.variants.find((variant) => variant.isDefault) ??
    product.variants.find((variant) => variant.availability.inStock) ??
    product.variants[0];

  const selection: VariantSelection = {};
  for (const option of product.options) {
    const match = option.values.find((value) => preferred.optionValueIds.includes(value.id));
    if (match) selection[option.id] = match.id;
  }
  return selection;
}

/** Human-readable label for a variant, e.g. "Matte White / Large". */
export function variantLabel(
  options: readonly ProductOption[],
  variant: Pick<ProductVariant, "optionValueIds">,
): string | null {
  const parts: string[] = [];
  for (const option of options) {
    const value = option.values.find((candidate) => variant.optionValueIds.includes(candidate.id));
    if (value) parts.push(value.label);
  }
  return parts.length > 0 ? parts.join(" / ") : null;
}

export interface ActivePurchaseState {
  variant: ProductVariant | null;
  price: Money;
  compareAtPrice: Money | null;
  availability: DetailedAvailability;
  sku: string | null;
  /** True when options exist and every one has been chosen. */
  selectionComplete: boolean;
  /**
   * True when the selection is complete but no variant carries that exact set
   * of option values. The Add-to-Cart control must then be disabled with an
   * explicit message rather than silently falling back to another variant.
   */
  combinationUnavailable: boolean;
  /** Whether Add to Cart may be enabled at all. */
  canAddToCart: boolean;
  /** Variant media to focus in the gallery, when the variant names one. */
  mediaId: number | null;
}

/**
 * The single source of truth for what the purchase panel displays and whether
 * Add to Cart is enabled. Prices are always server values from the product or
 * the resolved variant - never computed here.
 */
export function resolvePurchaseState(
  product: Pick<
    ProductDetail,
    "options" | "variants" | "price" | "compareAtPrice" | "availability" | "sku"
  >,
  selection: VariantSelection,
): ActivePurchaseState {
  const hasVariants = product.variants.length > 0;

  if (!hasVariants) {
    return {
      variant: null,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      availability: product.availability,
      sku: product.sku,
      selectionComplete: true,
      combinationUnavailable: false,
      canAddToCart: product.availability.inStock,
      mediaId: null,
    };
  }

  const selectionComplete = isSelectionComplete(product.options, selection);
  const variant = resolveVariant(product.variants, product.options, selection);
  const combinationUnavailable = selectionComplete && variant === null;

  if (!variant) {
    return {
      variant: null,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      availability: product.availability,
      sku: product.sku,
      selectionComplete,
      combinationUnavailable,
      canAddToCart: false,
      mediaId: null,
    };
  }

  return {
    variant,
    price: variant.price,
    compareAtPrice: variant.compareAtPrice,
    availability: variant.availability,
    sku: variant.sku,
    selectionComplete: true,
    combinationUnavailable: false,
    canAddToCart: variant.availability.inStock,
    mediaId: variant.mediaId,
  };
}

/** Upper bound for the quantity stepper: real tracked stock, or none. */
export function maxSelectableQuantity(availability: DetailedAvailability): number | null {
  if (availability.policy !== "track") return null;
  if (availability.quantity === null) return null;
  return availability.quantity > 0 ? availability.quantity : 0;
}
