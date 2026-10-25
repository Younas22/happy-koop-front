"use client";

import { Alert } from "@/components/ui/Alert";
import { useMessages } from "@/i18n/client";
import { fmt } from "@/i18n/format";
import type { CartValidation } from "@/lib/types/api";

export interface CartChangeNoticesProps {
  validation: CartValidation | null;
}

/**
 * Surfaces exactly what the server changed.
 *
 * `removedItems` and `adjustments` exist so the customer is told what happened
 * rather than silently seeing a different cart ("Only 2 left - quantity
 * reduced"). The server's `message` is displayed verbatim; nothing is
 * paraphrased or invented.
 */
export function CartChangeNotices({ validation }: CartChangeNoticesProps) {
  const t = useMessages().cart.notices;
  if (!validation) return null;

  const { removedItems, adjustments } = validation;
  const itemIssues = validation.items.flatMap((item) =>
    item.issues.map((issue) => ({ key: `${item.key}-${issue.code}`, name: item.name, issue })),
  );

  if (removedItems.length === 0 && adjustments.length === 0 && itemIssues.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2" aria-live="polite">
      {removedItems.length > 0 ? (
        <Alert tone="warning" title={t.removed}>
          <ul className="space-y-1">
            {removedItems.map((removed) => (
              <li key={`${removed.productId}:${removed.variantId ?? ""}`}>{removed.message}</li>
            ))}
          </ul>
        </Alert>
      ) : null}

      {adjustments.length > 0 ? (
        <Alert tone="warning" title={t.adjusted}>
          <ul className="space-y-1">
            {adjustments.map((adjustment) => (
              <li key={`${adjustment.key}-${adjustment.field}`}>
                {adjustment.message}
                {adjustment.field === "quantity" ? (
                  <>
                    {" "}
                    {fmt(t.quantityReduced, { from: adjustment.from, to: adjustment.to })}
                  </>
                ) : null}
              </li>
            ))}
          </ul>
        </Alert>
      ) : null}

      {itemIssues.length > 0 ? (
        <Alert tone="info" title={t.check}>
          <ul className="space-y-1">
            {itemIssues.map(({ key, name, issue }) => (
              <li key={key}>
                <span className="font-medium text-ink">{name}:</span> {issue.message}
              </li>
            ))}
          </ul>
        </Alert>
      ) : null}
    </div>
  );
}
