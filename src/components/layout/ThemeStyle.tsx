import { deriveBrandTokens } from "@/lib/utils/color";

export interface ThemeStyleProps {
  /** `theme.primaryColor` from runtime config. Validated before use. */
  primaryColor: string | null | undefined;
}

/**
 * Injects the admin-managed brand tokens onto `:root`.
 *
 * `globals.css` declares `--color-brand: var(--brand, #2563eb)` etc., so this
 * single style block re-points the whole palette. The hex is validated with a
 * strict regex and falls back to #2563EB when invalid, so a malformed settings
 * value can never inject CSS.
 *
 * Flat solid colours only - no gradient is ever produced from these tokens.
 */
export function ThemeStyle({ primaryColor }: ThemeStyleProps) {
  const tokens = deriveBrandTokens(primaryColor);

  // Every value below came out of a hex validator, so there is nothing here
  // that could terminate the style block or start a new declaration.
  const css = [
    ":root{",
    `--brand:${tokens.brand};`,
    `--brand-hover:${tokens.brandHover};`,
    `--brand-active:${tokens.brandActive};`,
    `--brand-tint:${tokens.brandTint};`,
    `--brand-ink:${tokens.brandInk};`,
    "}",
  ].join("");

  return <style id="hk-theme">{css}</style>;
}
