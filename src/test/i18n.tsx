import { render, type RenderOptions } from "@testing-library/react";
import * as React from "react";

import { LocaleProvider } from "@/i18n/client";
import type { Locale } from "@/i18n/config";
import { messagesFor } from "@/i18n/messages";

/**
 * `render`, inside the same provider the root layout supplies.
 *
 * Components read their labels from the dictionary, so a test renders them in
 * a language - English by default, which keeps existing assertions readable,
 * or another one to check that the translation is actually wired up.
 */
export function renderWithI18n(
  ui: React.ReactElement,
  { locale = "en", ...options }: RenderOptions & { locale?: Locale } = {},
) {
  return render(ui, {
    wrapper: ({ children }) => (
      <LocaleProvider locale={locale} messages={messagesFor(locale)}>
        {children}
      </LocaleProvider>
    ),
    ...options,
  });
}
