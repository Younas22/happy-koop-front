import { Link } from "@/i18n/Link";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { PRODUCT_SORTS, type ProductSort } from "@/lib/catalog/queries";
import { localizePath } from "@/i18n/paths";
import { getI18n } from "@/i18n/server";
import type { Category } from "@/lib/types/api";
import { cn } from "@/lib/utils/cn";

export interface ShopFiltersState {
  q: string | null;
  category: string | null;
  /** Major-unit text as typed, echoed back into the form. */
  minPriceText: string | null;
  maxPriceText: string | null;
  inStock: boolean;
  sort: ProductSort | null;
}

/** How many filters are actually narrowing the listing right now. */
export function countActiveFilters(state: ShopFiltersState): number {
  return [
    Boolean(state.q),
    Boolean(state.category),
    Boolean(state.minPriceText),
    Boolean(state.maxPriceText),
    state.inStock,
    Boolean(state.sort),
  ].filter(Boolean).length;
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
  /**
   * Prefix for every control id. The panel is rendered twice on a listing
   * page - once in the sidebar, once inside the mobile sheet - so the two
   * copies must not produce duplicate ids for the same label.
   */
  idPrefix?: string;
  /** Drops the card shell, for when the panel is already inside a sheet. */
  bare?: boolean;
  className?: string;
}

/**
 * Filter panel.
 *
 * A plain GET form, so filtering works without JavaScript and every state is a
 * shareable URL - posted to the listing of the language being read, because a
 * form `action` is not a `Link` and would otherwise drop a Dutch visitor back
 * on the English page. Submitting resets to page 1 by simply not carrying `page`.
 * The sort options are exactly the backend allowlist (contract 4) - an invalid
 * value would be a 422, so none can be constructed here.
 */
export async function ShopFilters({
  action,
  state,
  categories,
  showCategory = true,
  showSearch = true,
  currencySymbol,
  idPrefix = "filter",
  bare = false,
  className,
}: ShopFiltersProps) {
  const { locale, m } = await getI18n();
  const t = m.filters;
  const hasActiveFilters = countActiveFilters(state) > 0;
  const id = (name: string) => `${idPrefix}-${name}`;

  /** Native select, styled to match the M3 filled text field. */
  const selectClasses = cn(
    "h-12 w-full appearance-none rounded-md border border-line-strong bg-surface-low px-4 text-body-md text-ink",
    "transition-[background-color,border-color] duration-200 ease-(--ease-standard)",
    "hover:border-ink-subtle hover:bg-surface-container focus:border-brand focus:bg-surface",
  );

  return (
    <form
      action={localizePath(action, locale)}
      method="get"
      className={cn("space-y-5", !bare && "surface-card p-5", className)}
      aria-label={t.form}
    >
      {showSearch ? (
        <div className="space-y-2">
          <Label htmlFor={id("q")}>{t.search}</Label>
          <Input
            id={id("q")}
            type="search"
            name="q"
            maxLength={100}
            defaultValue={state.q ?? ""}
            placeholder={t.searchPlaceholder}
          />
        </div>
      ) : (
        <input type="hidden" name="q" value={state.q ?? ""} />
      )}

      {showCategory && categories && categories.length > 0 ? (
        <div className="space-y-2">
          <Label htmlFor={id("category")}>{t.category}</Label>
          <select
            id={id("category")}
            name="category"
            defaultValue={state.category ?? ""}
            className={selectClasses}
          >
            <option value="">{t.allCategories}</option>
            {categories.map((category) => (
              <option key={category.id} value={category.slug}>
                {category.name}
                {category.productCount > 0 ? ` (${category.productCount})` : ""}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <fieldset className="space-y-2">
        <legend className="text-label-lg text-ink">
          {t.price} <span className="font-normal text-ink-muted">({currencySymbol})</span>
        </legend>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <label htmlFor={id("min-price")} className="sr-only">
              {t.minPrice}
            </label>
            <Input
              id={id("min-price")}
              name="min"
              type="text"
              inputMode="decimal"
              pattern="[0-9]*\.?[0-9]*"
              defaultValue={state.minPriceText ?? ""}
              placeholder={t.min}
            />
          </div>
          <span aria-hidden="true" className="text-ink-subtle">
            &ndash;
          </span>
          <div className="flex-1">
            <label htmlFor={id("max-price")} className="sr-only">
              {t.maxPrice}
            </label>
            <Input
              id={id("max-price")}
              name="max"
              type="text"
              inputMode="decimal"
              pattern="[0-9]*\.?[0-9]*"
              defaultValue={state.maxPriceText ?? ""}
              placeholder={t.max}
            />
          </div>
        </div>
      </fieldset>

      <div className="flex min-h-12 items-center gap-3">
        <input
          id={id("in-stock")}
          type="checkbox"
          name="in_stock"
          value="1"
          defaultChecked={state.inStock}
          className="size-5 rounded-xs border-2 border-ink-subtle accent-brand"
        />
        <label htmlFor={id("in-stock")} className="text-body-md text-ink">
          {t.inStock}
        </label>
      </div>

      <div className="space-y-2">
        <Label htmlFor={id("sort")}>{t.sortBy}</Label>
        <select
          id={id("sort")}
          name="sort"
          defaultValue={state.sort ?? ""}
          className={selectClasses}
        >
          <option value="">{t.sortDefault}</option>
          {PRODUCT_SORTS.map((sort) => (
            <option key={sort} value={sort}>
              {t.sort[sort]}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        <Button type="submit" block className="sm:w-auto sm:flex-1">
          {t.apply}
        </Button>
        {hasActiveFilters ? (
          <Button asChild variant="ghost" className="sm:w-auto">
            <Link href={action}>{t.clear}</Link>
          </Button>
        ) : null}
      </div>
    </form>
  );
}
