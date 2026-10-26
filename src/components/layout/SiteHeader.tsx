import { Search } from "lucide-react";

import { AppBar } from "@/components/layout/AppBar";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { CategoryRail } from "@/components/layout/CategoryRail";
import { HeaderActions } from "@/components/layout/HeaderActions";
import { HeaderUtilityBar } from "@/components/layout/HeaderUtilityBar";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { PrimaryNav } from "@/components/layout/PrimaryNav";
import { fmt } from "@/i18n/format";
import { localizePath } from "@/i18n/paths";
import { getI18n } from "@/i18n/server";
import { fetchCategories } from "@/lib/catalog/queries";
import { megaMenuColumns } from "@/lib/layout/navigation";
import type { ResolvedRuntimeConfig } from "@/lib/types/api";

export interface SiteHeaderProps {
  config: ResolvedRuntimeConfig;
}

/**
 * Site header: an ink utility strip, then the sticky app bar.
 *
 * The bar is three zones - brand on the left, navigation centred, actions on
 * the right - so the eye lands on the mark, then the catalog, then the cart.
 * Navigation comes entirely from `navigation.primary`, and the category mega
 * menu from the catalog tree; both are read here, on the server, so the panel
 * ships inside the header markup instead of appearing after a client request.
 *
 * Search is an inline field from `lg`, where there is room for one, and an
 * icon that opens a dialog below that - a 1024px bar with five links cannot
 * also carry a 16rem input without crowding the brand.
 *
 * A failed category read is not a broken header: `columns` is simply empty and
 * the shop link stays a plain link.
 */
export async function SiteHeader({ config }: SiteHeaderProps) {
  const { navigation, store, features } = config;
  const { locale, m } = await getI18n();

  const { data: tree } = await fetchCategories({ tree: true });
  const columns = megaMenuColumns(tree ?? []);
  // The phone rail is one row of names, so it can carry more of the tree than
  // the menu panel and needs none of the children.
  const railColumns = megaMenuColumns(tree ?? [], { maxColumns: 10, maxChildren: 0 });

  return (
    <>
      <HeaderUtilityBar config={config} m={m} />

      <AppBar>
        <div className="page-container flex h-18 items-center gap-2 sm:gap-3 md:h-20 md:gap-6">
          {/* A phone's menu button belongs at the leading edge, before the
              brand mark - not as the fourth icon on the right. */}
          <MobileMenu
            primaryNav={navigation.primary}
            categories={columns}
            contact={{ email: store.email, phone: store.phone }}
            storeName={store.name}
          />

          {/* The mark is clamped rather than trusted: the uploaded logo can be
              any aspect ratio, and a wide one must not push the actions off a
              360px screen. */}
          <BrandLogo
            store={store}
            homeLabel={fmt(m.header.homeLabel, { store: store.name })}
            height={60}
            className="max-w-36 sm:max-w-52 lg:max-w-64"
            priority
          />

          <PrimaryNav links={navigation.primary} columns={columns} />

          {features.search ? (
            // A plain GET form so search works without JavaScript - posted to
            // the search page of the language being read.
            <form
              action={localizePath("/search", locale)}
              method="get"
              role="search"
              className="hidden lg:block"
            >
              <label htmlFor="site-search" className="sr-only">
                {m.header.searchProducts}
              </label>
              <div className="group relative flex items-center rounded-full border border-line bg-surface-low transition-[background-color,border-color,box-shadow] duration-200 ease-(--ease-standard) focus-within:border-brand focus-within:bg-surface focus-within:elevation-1 hover:border-line-strong">
                <Search
                  className="pointer-events-none absolute left-4 size-4 text-ink-subtle transition-colors group-focus-within:text-brand"
                  aria-hidden="true"
                />
                <input
                  id="site-search"
                  type="search"
                  name="q"
                  maxLength={100}
                  placeholder={m.header.searchPlaceholder}
                  className="h-10 w-52 rounded-full bg-transparent pr-4 pl-11 text-body-md text-ink outline-none placeholder:text-ink-subtle xl:w-64"
                />
              </div>
            </form>
          ) : null}

          <HeaderActions searchEnabled={features.search} />
        </div>
      </AppBar>

      <CategoryRail categories={railColumns} />
    </>
  );
}
