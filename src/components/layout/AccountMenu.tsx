"use client";

import { LogOut, Package, Settings, User as UserIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { useMessages } from "@/i18n/client";
import { Link } from "@/i18n/Link";
import type { SessionResult, User } from "@/lib/types/api";

/**
 * Account menu.
 *
 * `/login`, `/account`, `/account/orders` and `/admin` all resolve: the auth,
 * account and admin areas are implemented. `/admin` is still only an
 * affordance - the admin layout re-checks the viewer and the API authorizes
 * every admin request independently.
 *
 * The viewer is read from the same-origin `GET /api/auth/session` route
 * handler, so the header itself stays cacheable and no token ever reaches the
 * browser. `isAdmin` only decides whether the admin link is rendered - the
 * backend authorizes every admin request regardless.
 */
export function AccountMenu() {
  const router = useRouter();
  const m = useMessages();
  const [viewer, setViewer] = React.useState<User | null>(null);
  const [loaded, setLoaded] = React.useState(false);
  const [signingOut, setSigningOut] = React.useState(false);

  React.useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const response = await fetch("/api/auth/session", {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        if (!response.ok) return;
        const payload = (await response.json()) as { data?: SessionResult };
        setViewer(payload.data?.user ?? null);
      } catch {
        // No session info available; the menu falls back to the signed-out
        // state rather than guessing.
      } finally {
        setLoaded(true);
      }
    })();
    return () => controller.abort();
  }, []);

  async function signOut() {
    setSigningOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setViewer(null);
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  }

  if (!loaded || !viewer) {
    return (
      <Link
        href="/login"
        className="state-layer tap-target inline-flex items-center justify-center gap-1.5 rounded-full px-3 text-label-lg text-ink"
      >
        <UserIcon className="size-5" aria-hidden="true" />
        <span className="hidden xl:inline">{m.header.signIn}</span>
        <span className="sr-only xl:hidden">{m.header.signIn}</span>
      </Link>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="state-layer tap-target inline-flex items-center justify-center gap-1.5 rounded-full px-3 text-label-lg text-ink">
        <UserIcon className="size-5" aria-hidden="true" />
        <span className="hidden max-w-24 truncate xl:inline">{viewer.name}</span>
        <span className="sr-only xl:hidden">{m.header.account}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>{viewer.email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/account">
            <UserIcon className="size-4" aria-hidden="true" />
            {m.header.account}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/account/orders">
            <Package className="size-4" aria-hidden="true" />
            {m.header.orders}
          </Link>
        </DropdownMenuItem>
        {viewer.isAdmin ? (
          <DropdownMenuItem asChild>
            <Link href="/admin">
              <Settings className="size-4" aria-hidden="true" />
              {m.header.admin}
            </Link>
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void signOut()} disabled={signingOut}>
          <LogOut className="size-4" aria-hidden="true" />
          {signingOut ? m.header.signingOut : m.header.signOut}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
