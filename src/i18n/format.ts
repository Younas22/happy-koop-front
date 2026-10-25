import { LOCALE_INFO, type Locale } from "@/i18n/config";

/**
 * Message formatting: placeholders and plurals.
 *
 * Deliberately small. Messages are plain strings with `{name}` placeholders,
 * and plural forms are separate keys chosen by `Intl.PluralRules`, so a
 * translator edits words, not a templating language.
 */

/** Replaces `{name}` placeholders. An unknown placeholder is left visible. */
export function fmt(message: string, values: Record<string, string | number> = {}): string {
  return message.replace(/\{(\w+)\}/g, (whole, key: string) =>
    key in values ? String(values[key]) : whole,
  );
}

export interface PluralForms {
  one: string;
  other: string;
}

const rulesCache = new Map<Locale, Intl.PluralRules>();

function rules(locale: Locale): Intl.PluralRules {
  let found = rulesCache.get(locale);
  if (!found) {
    found = new Intl.PluralRules(LOCALE_INFO[locale].hreflang);
    rulesCache.set(locale, found);
  }
  return found;
}

/**
 * Picks the plural form for `count` and fills in `{count}`.
 *
 * English and Dutch both only distinguish "one" from "other"; a language with
 * more categories would add keys to `PluralForms`, and `Intl.PluralRules`
 * already knows which one to pick.
 */
export function plural(
  locale: Locale,
  count: number,
  forms: PluralForms,
  values: Record<string, string | number> = {},
): string {
  const category = rules(locale).select(count);
  const message = category === "one" ? forms.one : forms.other;
  return fmt(message, { count, ...values });
}
