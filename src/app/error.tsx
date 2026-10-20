"use client";

import Link from "next/link";
import * as React from "react";

import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";

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
  React.useEffect(() => {
    console.error("[storefront] unhandled error", error);
  }, [error]);

  return (
    <div className="page-container py-16">
      <ErrorState
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <Button onClick={reset}>Try again</Button>
            <Button asChild variant="secondary">
              <Link href="/">Go to the home page</Link>
            </Button>
          </div>
        }
      />
      {error.digest ? (
        <p className="mt-4 text-center text-xs text-ink-subtle">Reference: {error.digest}</p>
      ) : null}
    </div>
  );
}
