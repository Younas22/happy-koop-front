import type { Locale } from "@/i18n/config";
import { en } from "@/i18n/messages/en";
import { nl } from "@/i18n/messages/nl";

/** The dictionary shape, defined by the English source. */
export type Messages = typeof en;

const DICTIONARIES: Record<Locale, Messages> = { en, nl };

export function messagesFor(locale: Locale): Messages {
  return DICTIONARIES[locale];
}
