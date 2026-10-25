"use client";

import * as React from "react";

import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { useMessages } from "@/i18n/client";
import { fmt } from "@/i18n/format";
import { Link } from "@/i18n/Link";

/**
 * Root error boundary.
 *
 * `error.message` is NOT displayed: in production it is a digest, and in
 * development it can contain internals. The user gets a safe message and a
 * retry; the detail is logged for the server/console.
 */
export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const m = useMessages();

  React.useEffect(() => {
    console.error("[storefront] unhandled error", error);
  }, [error]);

  return (
    <div className="page-container py-16">
      <ErrorState
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <Button onClick={reset}>{m.common.tryAgain}</Button>
            <Button asChild variant="secondary">
              <Link href="/">{m.common.goHome}</Link>
            </Button>
          </div>
        }
      />
      {error.digest ? (
        <p className="mt-4 text-center text-body-sm text-ink-subtle">
          {fmt(m.ui.reference, { reference: error.digest })}
        </p>
      ) : null}
    </div>
  );
}
