import { MobileNavBar } from "@/components/layout/MobileNavBar";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Alert } from "@/components/ui/Alert";
import { getMessages } from "@/i18n/server";
import { getRuntimeConfig } from "@/lib/runtime-config";

/**
 * The storefront shell: header, footer and the phone navigation bar.
 *
 * This chrome used to live in the root layout, which meant the admin panel -
 * a different application with its own sidebar and top bar - was rendered
 * inside the shop's header and footer. The two now sit in separate route
 * groups under the same root, so neither can leak into the other, and the
 * admin never pays for the storefront's category and page reads either.
 *
 * `(storefront)` is a route group, so it adds nothing to any URL: `/`,
 * `/shop` and `/product/[slug]` are unchanged.
 */
export default async function StorefrontLayout({ children }: { children: React.ReactNode }) {
  const config = await getRuntimeConfig();
  const m = await getMessages();

  return (
    <>
      <SiteHeader config={config} />

      {config.degraded ? (
        <div className="page-container pt-4">
          <Alert tone="warning" title={m.degraded.title}>
            {m.degraded.body}
          </Alert>
        </div>
      ) : null}

      <main id="main" className="flex-1">
        {children}
      </main>

      <SiteFooter config={config} />

      {/* M3 navigation bar. Phones only; it hides itself on checkout, which
          owns the bottom of the screen for its own sticky action. */}
      <MobileNavBar searchEnabled={config.features.search} />
    </>
  );
}
