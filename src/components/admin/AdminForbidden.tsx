import { ShieldX } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/Button";

/**
 * Shown when a signed-in account has no admin affordance.
 *
 * It is honest about what happened: the screen is not available, and the
 * backend would refuse the requests anyway. No admin data is fetched to render
 * this, so nothing leaks.
 */
export function AdminForbidden() {
  return (
    <div className="page-container flex min-h-dvh items-center justify-center py-12">
      <div className="surface-card flex max-w-md flex-col items-center p-6 text-center">
        <span className="mb-4 inline-flex size-12 items-center justify-center rounded-full bg-danger-tint">
          <ShieldX className="size-6 text-danger" aria-hidden="true" />
        </span>

        <h1 className="text-lg font-semibold text-ink">You do not have admin access</h1>
        <p className="mt-2 text-sm text-ink-muted">
          This account is signed in but is not permitted to use the store admin. If you believe that
          is wrong, ask an administrator to grant your account an admin role.
        </p>
        <p className="mt-3 text-xs text-ink-subtle">
          Admin permissions are enforced by the API on every request, so this is not something the
          browser can change.
        </p>

        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Button asChild>
            <Link href="/">Back to the store</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/account">Your account</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
