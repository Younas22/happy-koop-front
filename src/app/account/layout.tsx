import { AccountNav } from "@/components/account/AccountNav";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { requireViewer } from "@/lib/auth/session";

/**
 * Account area shell.
 *
 * `requireViewer` runs on the server for every nested route and redirects to
 * `/login?next=…` when there is no valid session. The API independently
 * scopes and authorizes each request, so this is a routing convenience rather
 * than the security boundary.
 */
export default async function AccountLayout({ children }: LayoutProps<"/account">) {
  const viewer = await requireViewer("/account");

  return (
    <div className="page-container py-6 sm:py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }]} current="Account" />

      <div className="mt-3 flex flex-wrap items-end justify-between gap-2">
        <h1 className="text-2xl font-semibold text-ink sm:text-3xl">Your account</h1>
        <p className="text-sm text-ink-muted">{viewer.email}</p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[14rem_1fr] lg:gap-8">
        <div className="min-w-0 lg:self-start">
          <AccountNav />
        </div>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
