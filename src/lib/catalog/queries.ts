import {
  ApiError,
  apiGet,
  apiGetPaginated,
  apiGetPaginatedWithSummary,
  apiPost,
  tryApi,
} from "@/lib/api/client";
import { DEFAULT_LOCALE } from "@/i18n/config";
import type {
  CartValidation,
  CartValidationRequest,
  Category,
  CategoryDetail,
  HomeContent,
  Page,
  PageSummary,
  Paginated,
  ProductCard,
  ProductDetail,
  Review,
  ReviewSort,
  ReviewSummary,
  ShippingOption,
} from "@/lib/types/api";

/**
 * Read models for the public storefront.
 *
 * Every function here returns `{ data, error }` rather than throwing. The
 * production build must succeed with the backend down, so a failed fetch
 * yields `data: null` plus the normalized `ApiError`, and the page renders a
 * real error or empty state. Nothing is ever substituted with placeholder
 * content.
 */

export type Result<T> = { data: T | null; error: ApiError | null };

/* Cache windows. Catalog data is admin-managed and changes rarely, but is
 * never cached indefinitely. */
const REVALIDATE_HOME = 120;
const REVALIDATE_LIST = 60;
const REVALIDATE_DETAIL = 300;
const REVALIDATE_CATEGORIES = 300;
const REVALIDATE_PAGE = 600;

export const CACHE_TAGS = {
  home: "home",
  products: "products",
  categories: "categories",
  pages: "pages",
  product: (slug: string) => `product:${slug}`,
  category: (slug: string) => `category:${slug}`,
  page: (slug: string) => `page:${slug}`,
} as const;

/* ------------------------------------------------------------------ *
 * Home
 * ------------------------------------------------------------------ */

export function fetchHomeContent(): Promise<Result<HomeContent>> {
  return tryApi(() =>
    apiGet<HomeContent>("/home", {
      revalidate: REVALIDATE_HOME,
      tags: [CACHE_TAGS.home],
    }),
  );
}

/* ------------------------------------------------------------------ *
 * Products
 * ------------------------------------------------------------------ */

/** Allowlisted `sort` values for `GET /products` (contract 4). */
export const PRODUCT_SORTS = [
  "relevance",
  "newest",
  "price_asc",
  "price_desc",
  "name_asc",
  "name_desc",
] as const;

export type ProductSort = (typeof PRODUCT_SORTS)[number];

export function isProductSort(
  value: string | null | undefined,
): value is ProductSort {
  return (
    typeof value === "string" &&
    (PRODUCT_SORTS as readonly string[]).includes(value)
  );
}

export interface ProductListParams {
  q?: string | null;
  category?: string | null;
  /** Minor units (contract 4). */
  minPrice?: number | null;
  maxPrice?: number | null;
  inStock?: boolean | null;
  sort?: ProductSort | null;
  page?: number;
  perPage?: number;
}

export function fetchProducts(
  params: ProductListParams = {},
): Promise<Result<Paginated<ProductCard>>> {
  return tryApi(() =>
    apiGetPaginated<ProductCard>("/products", {
      // Query keys are snake_case per contract 1.1.
      query: {
        q: params.q ?? null,
        category: params.category ?? null,
        min_price: params.minPrice ?? null,
        max_price: params.maxPrice ?? null,
        in_stock: params.inStock === true ? true : null,
        sort: params.sort ?? null,
        page: params.page && params.page > 1 ? params.page : null,
        per_page: params.perPage ?? null,
      },
      revalidate: REVALIDATE_LIST,
      tags: [CACHE_TAGS.products],
    }),
  );
}

export function fetchProduct(slug: string): Promise<Result<ProductDetail>> {
  return tryApi(() =>
    apiGet<ProductDetail>(`/products/${encodeURIComponent(slug)}`, {
      revalidate: REVALIDATE_DETAIL,
      tags: [CACHE_TAGS.products, CACHE_TAGS.product(slug)],
    }),
  );
}

export interface ReviewListParams {
  page?: number;
  perPage?: number;
  sort?: ReviewSort;
  /** 1..5 filter. */
  rating?: number | null;
}

export function fetchProductReviews(
  slug: string,
  params: ReviewListParams = {},
): Promise<Result<Paginated<Review> & { summary: ReviewSummary | null }>> {
  return tryApi(() =>
    apiGetPaginatedWithSummary<Review, ReviewSummary>(
      `/products/${encodeURIComponent(slug)}/reviews`,
      {
        query: {
          page: params.page && params.page > 1 ? params.page : null,
          per_page: params.perPage ?? null,
          sort: params.sort ?? null,
          rating: params.rating ?? null,
        },
        revalidate: REVALIDATE_DETAIL,
        tags: [CACHE_TAGS.product(slug)],
      },
    ),
  );
}

export function fetchRelatedProducts(
  slug: string,
  limit = 4,
): Promise<Result<ProductCard[]>> {
  return tryApi(() =>
    apiGet<ProductCard[]>(`/products/${encodeURIComponent(slug)}/related`, {
      query: { limit },
      revalidate: REVALIDATE_DETAIL,
      tags: [CACHE_TAGS.products, CACHE_TAGS.product(slug)],
    }),
  );
}

/* ------------------------------------------------------------------ *
 * Categories
 * ------------------------------------------------------------------ */

export function fetchCategories(
  options: { tree?: boolean } = {},
): Promise<Result<Category[]>> {
  return tryApi(() =>
    apiGet<Category[]>("/categories", {
      query: { tree: options.tree === true ? true : null },
      revalidate: REVALIDATE_CATEGORIES,
      tags: [CACHE_TAGS.categories],
    }),
  );
}

export function fetchCategory(slug: string): Promise<Result<CategoryDetail>> {
  return tryApi(() =>
    apiGet<CategoryDetail>(`/categories/${encodeURIComponent(slug)}`, {
      revalidate: REVALIDATE_CATEGORIES,
      tags: [CACHE_TAGS.categories, CACHE_TAGS.category(slug)],
    }),
  );
}

/* ------------------------------------------------------------------ *
 * CMS pages
 * ------------------------------------------------------------------ */

/**
 * Published CMS pages, titles only.
 *
 * Cached with the same tag as the pages themselves, so publishing or renaming
 * a page in the admin refreshes the footer list along with the page.
 */
export function fetchPages(
  locale?: string | null,
): Promise<Result<PageSummary[]>> {
  return tryApi(() =>
    apiGet<PageSummary[]>("/pages", {
      query: { locale: pageLocale(locale) },
      revalidate: REVALIDATE_PAGE,
      tags: [CACHE_TAGS.pages],
    }),
  );
}

/**
 * A CMS page in the visitor's language. The API returns the translation when
 * the page has one and the default language for anything not translated; the
 * locale is part of the URL, so each language is cached separately.
 */
export function fetchPage(
  slug: string,
  locale?: string | null,
): Promise<Result<Page>> {
  return tryApi(() =>
    apiGet<Page>(`/pages/${encodeURIComponent(slug)}`, {
      query: { locale: pageLocale(locale) },
      revalidate: REVALIDATE_PAGE,
      tags: [CACHE_TAGS.pages, CACHE_TAGS.page(slug)],
    }),
  );
}

/** The default language needs no parameter, which keeps its cache entry as it was. */
function pageLocale(locale?: string | null): string | null {
  return locale && locale !== DEFAULT_LOCALE ? locale : null;
}

/* ------------------------------------------------------------------ *
 * Cart and shipping (never cached - prices and stock must be live)
 * ------------------------------------------------------------------ */

export function validateCart(
  body: CartValidationRequest,
): Promise<Result<CartValidation>> {
  return tryApi(() =>
    apiPost<CartValidation>("/cart/validate", body, { revalidate: false }),
  );
}

export interface ShippingOptionsParams {
  countryCode: string;
  postalCode?: string | null;
  /** Minor units; used only for free-shipping thresholds (contract 5). */
  subtotalAmount?: number | null;
}

export function fetchShippingOptions(
  params: ShippingOptionsParams,
): Promise<Result<ShippingOption[]>> {
  return tryApi(() =>
    apiGet<ShippingOption[]>("/shipping/options", {
      query: {
        country_code: params.countryCode,
        postal_code: params.postalCode ?? null,
        subtotal_amount: params.subtotalAmount ?? null,
      },
      revalidate: false,
    }),
  );
}
