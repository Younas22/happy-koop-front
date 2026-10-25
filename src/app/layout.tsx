import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";

import { ThemeStyle } from "@/components/layout/ThemeStyle";
import { TooltipProvider } from "@/components/ui/Tooltip";
import { LocaleProvider } from "@/i18n/client";
import { LOCALE_INFO } from "@/i18n/config";
import { getI18n, getLocale } from "@/i18n/server";
import { getRuntimeConfig } from "@/lib/runtime-config";
import { buildRootMetadata } from "@/lib/utils/seo";

import "./globals.css";

/**
 * The font variable `globals.css` expects: `--font-sans` is built on
 * `--font-hk-sans`, so this is the only place the typeface is chosen.
 */
const sans = Inter({
  variable: "--font-hk-sans",
  subsets: ["latin"],
  display: "swap",
});

/**
 * Metadata and the favicon come from the admin-managed runtime config.
 * `getRuntimeConfig` never throws, so a build with the API down still produces
 * valid metadata from the neutral defaults.
 */
export async function generateMetadata(): Promise<Metadata> {
  const config = await getRuntimeConfig();
  return buildRootMetadata(config, await getLocale());
}

/**
 * The document shell, and nothing else.
 *
 * Deliberately free of application chrome: the storefront's header and footer
 * live in the `(storefront)` route group and the admin's sidebar and top bar
 * under `/admin`, so neither application can render inside the other. What
 * stays here is what both need - the document, the typeface, the
 * admin-managed brand tokens, the tooltip context and one toast outlet.
 *
 * The skip link stays here too, because every subtree below renders its own
 * `#main`.
 */
export default async function RootLayout({ children }: LayoutProps<"/">) {
  const config = await getRuntimeConfig();
  // The display language comes from the URL (via the proxy), not from the
  // store's money locale: a Dutch page in a USD store is still `lang="nl"`.
  const { locale, m } = await getI18n();

  return (
    <html lang={LOCALE_INFO[locale].htmlLang} className={`${sans.variable} h-full`}>
      <head>
        {/* Brand tokens from store settings, injected before first paint. */}
        <ThemeStyle primaryColor={config.theme.primaryColor} />
      </head>
      <body className="flex min-h-full flex-col">
        <a href="#main" className="sr-only-focusable z-50 bg-brand px-4 py-2 text-brand-ink">
          {m.common.skipToContent}
        </a>

        {/* One dictionary - the page's own language - reaches the browser. */}
        <LocaleProvider locale={locale} messages={m}>
          <TooltipProvider delayDuration={200}>
            {children}

            {/* Form feedback. Bottom-centre, lifted clear of the M3 navigation
                bar on a phone so a toast never sits under the bar or over a
                sticky checkout action. */}
            <Toaster
              position="bottom-center"
              closeButton
              richColors
              mobileOffset={{ bottom: "5.5rem" }}
            />
          </TooltipProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
