import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { PRODUCT_SORTS, type ProductSort } from "@/lib/catalog/queries";
import type { Category } from "@/lib/types/api";
import { cn } from "@/lib/utils/cn";

const SORT_LABELS: Record<ProductSort, string> = {
  relevance: "Relevance",
  newest: "Newest",
  price_asc: "Price: low to high",
  price_desc: "Price: high to low",
  name_asc: "Name: A to Z",
  name_desc: "Name: Z to A",
};

export interface ShopFiltersState {
  q: string | null;
  category: string | null;
  /** Major-unit text as typed, echoed back into the form. */
  minPriceText: string | null;
  maxPriceText: string | null;
  inStock: boolean;
  sort: ProductSort | null;
}

export interface ShopFiltersProps {
  /** The route the form submits to, e.g. `/shop` or `/category/kitchen`. */
  action: string;
  state: ShopFiltersState;
  /** `null` when the category list could not be loaded. */
  categories: Category[] | null;
  /** Hides the category control on a category page. */
  showCategory?: boolean;
  /** Hides the search box when the page already is the search results. */
  showSearch?: boolean;
  currencySymbol: string;
  className?: string;
}

/**
 * Filter panel.
 *
 * A plain GET form, so filtering works without JavaScript and every state is a
 * shareable URL. Submitting resets to page 1 by simply not carrying `page`.
 * The sort options are exactly the backend allowlist (contract 4) - an invalid
 * value would be a 422, so none can be constructed here.
 */
export function ShopFilters({
  action,
  state,
  categories,
  showCategory = true,
  showSearch = true,
  currencySymbol,
  className,
}: ShopFiltersProps) {
  const hasActiveFilters =
    Boolean(state.q) ||
    Boolean(state.category) ||
    Boolean(state.minPriceText) ||
    Boolean(state.maxPriceText) ||
    state.inStock ||
    Boolean(state.sort);

  return (
    <form
      action={action}
      method="get"
      className={cn("surface-card space-y-4 p-4", className)}
      aria-label="Product filters"
    >
      {showSearch ? (
        <div className="space-y-1.5">
          <Label htmlFor="filter-q">Search</Label>
          <Input
            id="filter-q"
            type="search"
            name="q"
            maxLength={100}
            defaultValue={state.q ?? ""}
            placeholder="Product name or SKU"
          />
        </div>
      ) : (
        <input type="hidden" name="q" value={state.q ?? ""} />
      )}

      {showCategory && categories && categories.length > 0 ? (
        <div className="space-y-1.5">
          <Label htmlFor="filter-category">Category</Label>
          <select
            id="filter-category"
            name="category"
            defaultValue={state.category ?? ""}
            className="h-11 w-full rounded-md border border-line-strong bg-surface px-3 text-sm text-ink"
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.slug}>
                {category.name}
                {category.productCount > 0 ? ` (${category.productCount})` : ""}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <fieldset className="space-y-1.5">
        <legend className="text-sm font-medium text-ink">
          Price <span className="font-normal text-ink-muted">({currencySymbol})</span>
        </legend>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <label htmlFor="filter-min-price" className="sr-only">
              Minimum price
            </label>
            <Input
              id="filter-min-price"
              name="min"
              type="text"
              inputMode="decimal"
              pattern="[0-9]*\.?[0-9]*"
              defaultValue={state.minPriceText ?? ""}
              placeholder="Min"
            />
          </div>
          <span aria-hidden="true" className="text-ink-subtle">
            &ndash;
          </span>
          <div className="flex-1">
            <label htmlFor="filter-max-price" className="sr-only">
              Maximum price
            </label>
            <Input
              id="filter-max-price"
              name="max"
              type="text"
              inputMode="decimal"
              pattern="[0-9]*\.?[0-9]*"
              defaultValue={state.maxPriceText ?? ""}
              placeholder="Max"
            />
          </div>
        </div>
      </fieldset>

      <div className="flex min-h-11 items-center gap-2.5">
        <input
          id="filter-in-stock"
          type="checkbox"
          name="in_stock"
          value="1"
          defaultChecked={state.inStock}
          className="size-5 rounded-xs border-line-strong accent-brand"
        />
        <label htmlFor="filter-in-stock" className="text-sm text-ink">
          In stock only
        </label>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="filter-sort">Sort by</Label>
        <select
          id="filter-sort"
          name="sort"
          defaultValue={state.sort ?? ""}
          className="h-11 w-full rounded-md border border-line-strong bg-surface px-3 text-sm text-ink"
        >
          <option value="">Default</option>
          {PRODUCT_SORTS.map((sort) => (
            <option key={sort} value={sort}>
              {SORT_LABELS[sort]}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        <Button type="submit" block className="sm:w-auto sm:flex-1">
          Apply filters
        </Button>
        {hasActiveFilters ? (
          <Button asChild variant="ghost" className="sm:w-auto">
            <Link href={action}>Clear</Link>
          </Button>
        ) : null}
      </div>
    </form>
  );
}
