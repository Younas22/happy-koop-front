import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { ThemeStyle } from "@/components/layout/ThemeStyle";
import { Alert } from "@/components/ui/Alert";
import { TooltipProvider } from "@/components/ui/Tooltip";
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
  return buildRootMetadata(config);
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const config = await getRuntimeConfig();

  return (
    <html lang={config.locale.locale.split("-")[0] || "en"} className={`${sans.variable} h-full`}>
      <head>
        {/* Brand tokens from store settings, injected before first paint. */}
        <ThemeStyle primaryColor={config.theme.primaryColor} />
      </head>
      <body className="flex min-h-full flex-col">
        <a href="#main" className="sr-only-focusable z-50 bg-brand px-4 py-2 text-brand-ink">
          Skip to content
        </a>

        <TooltipProvider delayDuration={200}>
          <SiteHeader config={config} />

          {config.degraded ? (
            <div className="page-container pt-4">
              <Alert tone="warning" title="Store settings are unavailable">
                We could not load the store configuration, so some details may be missing. No
                product data or prices are being shown from a stale copy.
              </Alert>
            </div>
          ) : null}

          <main id="main" className="flex-1">
            {children}
          </main>

          <SiteFooter config={config} />
        </TooltipProvider>
      </body>
    </html>
  );
}
