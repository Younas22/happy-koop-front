"use client";

import { LogOut, Package, Settings, User as UserIcon } from "lucide-react";
import Link from "next/link";
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
        className="tap-target inline-flex items-center justify-center gap-1.5 rounded-md px-2 text-sm font-medium text-ink transition-colors hover:bg-sunken"
      >
        <UserIcon className="size-5" aria-hidden="true" />
        <span className="hidden lg:inline">Sign in</span>
      </Link>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="tap-target inline-flex items-center justify-center gap-1.5 rounded-md px-2 text-sm font-medium text-ink transition-colors hover:bg-sunken">
        <UserIcon className="size-5" aria-hidden="true" />
        <span className="hidden max-w-24 truncate lg:inline">{viewer.name}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>{viewer.email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/account">
            <UserIcon className="size-4" aria-hidden="true" />
            Account
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/account/orders">
            <Package className="size-4" aria-hidden="true" />
            Orders
          </Link>
        </DropdownMenuItem>
        {viewer.isAdmin ? (
          <DropdownMenuItem asChild>
            <Link href="/admin">
              <Settings className="size-4" aria-hidden="true" />
              Admin
            </Link>
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void signOut()} disabled={signingOut}>
          <LogOut className="size-4" aria-hidden="true" />
          {signingOut ? "Signing out…" : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
