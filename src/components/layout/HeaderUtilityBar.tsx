import { Mail, Phone, Truck } from "lucide-react";

import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { fmt } from "@/i18n/format";
import type { Messages } from "@/i18n/messages";
import type { ResolvedRuntimeConfig } from "@/lib/types/api";

export interface HeaderUtilityBarProps {
  config: ResolvedRuntimeConfig;
  m: Messages;
}

/**
 * The ink-coloured strip above the app bar.
 *
 * It frames the header - and, with the ink footer, the whole page - in the
 * brand's darkest tone. What it says is always real: the store's own shipping
 * summary and contact details on the left when an admin has written them, and
 * on the right the language switcher and the currency prices are shown in,
 * which every store has. No promotion, no countdown, no "free shipping today"
 * that no setting backs.
 *
 * It sits outside the sticky app bar on purpose, so it scrolls away and the
 * bar that follows the viewer down the page stays one row tall.
 */
export function HeaderUtilityBar({ config, m }: HeaderUtilityBarProps) {
  const { store, policies, locale } = config;
  const shipping = policies.shippingSummary?.trim() || null;
  const lead = shipping ?? (store.tagline?.trim() || null);

  return (
    <div className="bg-ink text-ink-inverse">
      <div className="page-container flex h-9 items-center justify-between gap-4 text-body-sm">
        <div className="flex min-w-0 items-center gap-5">
          {lead ? (
            <p className="flex min-w-0 items-center gap-2 text-ink-inverse/80">
              {shipping ? <Truck className="size-3.5 shrink-0" aria-hidden="true" /> : null}
              <span className="truncate">{lead}</span>
            </p>
          ) : null}

          {/* Contact details only from `lg`: smaller screens have the drawer for them. */}
          {store.phone || store.email ? (
            <ul className="hidden shrink-0 items-center gap-5 text-ink-inverse/70 lg:flex">
              {store.phone ? (
                <li>
                  <a
                    href={`tel:${store.phone.replace(/[^+\d]/g, "")}`}
                    className="inline-flex items-center gap-1.5 rounded-xs transition-colors hover:text-ink-inverse"
                  >
                    <Phone className="size-3.5" aria-hidden="true" />
                    {store.phone}
                  </a>
                </li>
              ) : null}
              {store.email ? (
                <li>
                  <a
                    href={`mailto:${store.email}`}
                    className="inline-flex items-center gap-1.5 rounded-xs transition-colors hover:text-ink-inverse"
                  >
                    <Mail className="size-3.5" aria-hidden="true" />
                    {store.email}
                  </a>
                </li>
              ) : null}
            </ul>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-4">
          <p className="hidden text-label-md tracking-wide text-ink-inverse/65 sm:block">
            {fmt(m.header.pricesIn, { currency: locale.currency })}
          </p>
          <span aria-hidden="true" className="hidden h-3.5 w-px bg-white/15 sm:block" />
          <LanguageSwitcher tone="dark" />
        </div>
      </div>
    </div>
  );
}
