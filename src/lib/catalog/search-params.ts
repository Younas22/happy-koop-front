import { parseMajorUnitsToMinor } from "@/lib/money";
import { isProductSort, type ProductListParams, type ProductSort } from "@/lib/catalog/queries";
import { buildQuery } from "@/lib/utils/url";

/**
 * Listing state parsed from `searchParams`.
 *
 * Every value is validated here, so an invalid `sort` or a junk price never
 * reaches the API (which would answer 422). Unknown parameters are dropped.
 */

export type RawSearchParams = Record<string, string | string[] | undefined>;

export interface ListingState {
  q: string | null;
  category: string | null;
  /** Major-unit text exactly as typed, so the form can echo it back. */
  minPriceText: string | null;
  maxPriceText: string | null;
  /** Minor units for the API. */
  minPrice: number | null;
  maxPrice: number | null;
  inStock: boolean;
  sort: ProductSort | null;
  page: number;
  perPage: number;
}

function first(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export const DEFAULT_PER_PAGE = 24;

export function parseListingSearchParams(
  params: RawSearchParams,
  minorUnitExponent: number,
): ListingState {
  const q = (first(params.q) ?? "").trim().slice(0, 100) || null;
  const category = (first(params.category) ?? "").trim().slice(0, 150) || null;

  const minPriceText = (first(params.min) ?? "").trim() || null;
  const maxPriceText = (first(params.max) ?? "").trim() || null;

  const inStockRaw = first(params.in_stock);
  const inStock = inStockRaw === "1" || inStockRaw === "true";

  const sortRaw = first(params.sort);
  const sort = isProductSort(sortRaw) ? sortRaw : null;

  const pageRaw = Number.parseInt(first(params.page) ?? "", 10);
  const page = Number.isInteger(pageRaw) && pageRaw > 0 ? pageRaw : 1;

  const perPageRaw = Number.parseInt(first(params.per_page) ?? "", 10);
  const perPage =
    Number.isInteger(perPageRaw) && perPageRaw >= 1 && perPageRaw <= 60 ? perPageRaw : DEFAULT_PER_PAGE;

  return {
    q,
    category,
    minPriceText,
    maxPriceText,
    minPrice: parseMajorUnitsToMinor(minPriceText, minorUnitExponent),
    maxPrice: parseMajorUnitsToMinor(maxPriceText, minorUnitExponent),
    inStock,
    sort,
    page,
    perPage,
  };
}

/** The validated state, as the `GET /products` query. */
export function toProductListParams(state: ListingState): ProductListParams {
  return {
    q: state.q,
    category: state.category,
    minPrice: state.minPrice,
    maxPrice: state.maxPrice,
    inStock: state.inStock ? true : null,
    sort: state.sort,
    page: state.page,
    perPage: state.perPage === DEFAULT_PER_PAGE ? undefined : state.perPage,
  };
}

/**
 * Rebuilds the current URL for a different page, preserving every filter so
 * pagination links stay shareable.
 */
export function buildListingHref(basePath: string, state: ListingState, page: number): string {
  return (
    basePath +
    buildQuery({
      q: state.q,
      category: state.category,
      min: state.minPriceText,
      max: state.maxPriceText,
      in_stock: state.inStock ? "1" : null,
      sort: state.sort,
      per_page: state.perPage === DEFAULT_PER_PAGE ? null : state.perPage,
      page: page > 1 ? page : null,
    })
  );
}
