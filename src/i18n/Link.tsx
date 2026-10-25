"use client";

import NextLink from "next/link";
import * as React from "react";

import { useLocale } from "@/i18n/client";
import { localizePath } from "@/i18n/paths";

type NextLinkProps = React.ComponentProps<typeof NextLink>;

/**
 * `next/link`, but in the visitor's language.
 *
 * Every storefront link is written as a locale-free path (`/shop`,
 * `/product/x`) and this component adds the prefix for the current language,
 * so no component has to know which language it is rendering in. External
 * URLs, `mailto:`/`tel:` links and the admin/API paths pass through untouched.
 *
 * It is a drop-in replacement - same name, same props - which is what let the
 * whole storefront switch over by changing one import per file.
 */
export const Link = React.forwardRef<HTMLAnchorElement, NextLinkProps>(function Link(
  { href, ...props },
  ref,
) {
  const locale = useLocale();

  const localizedHref: NextLinkProps["href"] =
    typeof href === "string"
      ? localizePath(href, locale)
      : href.pathname
        ? { ...href, pathname: localizePath(href.pathname, locale) }
        : href;

  return <NextLink ref={ref} href={localizedHref} {...props} />;
});

export default Link;
