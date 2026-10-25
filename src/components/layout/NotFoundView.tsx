"use client";

import { SearchX } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { useMessages } from "@/i18n/client";
import { Link } from "@/i18n/Link";

/**
 * The 404 body, shared by the two not-found boundaries.
 *
 * `(storefront)/not-found.tsx` renders it inside the shop chrome - that is
 * what a `notFound()` from a product, category or CMS page reaches - while the
 * root boundary renders it bare, for a URL that matched no route in either
 * application and therefore has no chrome to be sure of.
 */
export function NotFoundView() {
  const m = useMessages();

  return (
    <div className="page-container py-16">
      <EmptyState
        icon={SearchX}
        title={m.notFound.title}
        description={m.notFound.description}
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <Button asChild>
              <Link href="/shop">{m.common.browseShop}</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/">{m.common.goHome}</Link>
            </Button>
          </div>
        }
      />
    </div>
  );
}
