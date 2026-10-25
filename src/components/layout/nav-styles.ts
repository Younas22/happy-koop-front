import { cn } from "@/lib/utils/cn";

/**
 * The shared look of a desktop bar item: text, with a 2px brand rule under the
 * active one. An underline reads as "you are here" without filling the bar
 * with tonal pills, and keeps the centred navigation light next to the brand.
 *
 * Used by plain links, the "More" trigger and the category menu trigger, so
 * all three line up and highlight identically.
 */
export function navItemClass(active: boolean): string {
  return cn(
    "relative inline-flex min-h-11 max-w-44 items-center gap-1 truncate px-3 text-label-lg transition-colors duration-200 ease-(--ease-standard)",
    "after:absolute after:inset-x-3 after:bottom-1.5 after:h-0.5 after:rounded-full after:transition-transform after:duration-200 after:ease-(--ease-standard)",
    active
      ? "font-semibold text-ink after:scale-x-100 after:bg-brand"
      : "text-ink-muted after:scale-x-0 after:bg-line-strong hover:text-ink hover:after:scale-x-100",
  );
}
