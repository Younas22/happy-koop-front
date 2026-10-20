/**
 * Date formatting.
 *
 * Timestamps are UTC ISO-8601 with offset and the display timezone comes from
 * runtime config (contract 1.6, 3). Nothing is guessed: an absent or
 * unparseable value renders as `null` and the caller hides the row rather than
 * printing a placeholder date.
 */

export interface DateFormatOptions {
  locale?: string;
  timeZone?: string;
  withTime?: boolean;
}

export function formatDate(
  value: string | null | undefined,
  options: DateFormatOptions = {},
): string | null {
  if (!value) return null;
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return null;

  const { locale = "en-US", timeZone, withTime = false } = options;

  try {
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
      ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
      ...(timeZone ? { timeZone } : {}),
    }).format(new Date(parsed));
  } catch {
    // An invalid locale or timezone from settings must not break the page.
    return new Date(parsed).toISOString().slice(0, withTime ? 16 : 10).replace("T", " ");
  }
}

export function formatDateTime(
  value: string | null | undefined,
  options: Omit<DateFormatOptions, "withTime"> = {},
): string | null {
  return formatDate(value, { ...options, withTime: true });
}

/** True when an ISO timestamp is in the past. Used for checkout expiry. */
export function isExpired(value: string | null | undefined): boolean {
  if (!value) return false;
  const parsed = Date.parse(value);
  return !Number.isNaN(parsed) && parsed < Date.now();
}
