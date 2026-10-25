import { Link } from "@/i18n/Link";
import * as React from "react";

/**
 * Shared frame for the four auth screens. Narrow single column, centred, with
 * a 16px gutter at 360px and no horizontal overflow.
 */
export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: string | null;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="page-container py-10 sm:py-14">
      <div className="mx-auto w-full max-w-md">
        <h1 className="text-headline-sm text-ink sm:text-headline-md">{title}</h1>
        {description ? <p className="mt-2 text-body-md text-ink-muted">{description}</p> : null}

        <div className="surface-card mt-6 p-5 sm:p-7">{children}</div>

        {footer ? <div className="mt-5 text-body-md text-ink-muted">{footer}</div> : null}
      </div>
    </div>
  );
}

export function AuthFooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="font-medium text-brand underline-offset-2 hover:underline">
      {children}
    </Link>
  );
}
