"use client";

import { Pencil, Plus, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import {
  deleteShippingZoneAction,
  saveShippingZoneAction,
} from "@/app/admin/actions";
import { AdminTableWrap, Td, Th } from "@/components/admin/AdminParts";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CheckboxField } from "@/components/ui/Checkbox";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { flattenFieldErrors } from "@/lib/forms/api-errors";
import { countryName, countryOptions } from "@/lib/geo/countries";
import { parseMajorUnitsToMinor, toMajorUnitString } from "@/lib/money";
import type {
  AdminShippingRate,
  AdminShippingZone,
  AdminShippingZoneInput,
  Money,
} from "@/lib/types/api";

/**
 * Shipping zones with their rates, edited together in one dialog.
 *
 * Checkout offers a destination only the rates of the zone that covers it, so
 * a country with no zone is blocked at checkout. The API rejects a country
 * that is already in another zone; the picker shows those as taken up front.
 * Amounts are typed in major units and sent as integer minor units.
 */

const CATCH_ALL = "*";

// Member states, for the one-click "EU" shortcut.
const EU_CODES = [
  "AT", "BE", "BG", "CY", "CZ", "DE", "DK", "EE", "ES", "FI", "FR", "GR", "HR", "HU",
  "IE", "IT", "LT", "LU", "LV", "MT", "NL", "PL", "PT", "RO", "SE", "SI", "SK",
];

interface RateDraft {
  key: number;
  id: number | null;
  code: string;
  label: string;
  description: string;
  price: string;
  freeAbove: string;
  minSubtotal: string;
  minDays: string;
  maxDays: string;
  isDefault: boolean;
  isActive: boolean;
}

interface Draft {
  name: string;
  countryCodes: string[];
  isActive: boolean;
  sortOrder: string;
  rates: RateDraft[];
}

let nextKey = 1;

function moneyText(money: Money | null, exponent: number): string {
  return money === null ? "" : toMajorUnitString(money, exponent);
}

function toRateDraft(rate: AdminShippingRate | null, exponent: number): RateDraft {
  return {
    key: nextKey++,
    id: rate?.id ?? null,
    code: rate?.code ?? "",
    label: rate?.label ?? "",
    description: rate?.description ?? "",
    price: rate ? moneyText(rate.price, exponent) : "",
    freeAbove: moneyText(rate?.freeAbove ?? null, exponent),
    minSubtotal: moneyText(rate?.minSubtotal ?? null, exponent),
    minDays: rate?.estimateMinDays == null ? "" : String(rate.estimateMinDays),
    maxDays: rate?.estimateMaxDays == null ? "" : String(rate.estimateMaxDays),
    isDefault: rate?.isDefault ?? false,
    isActive: rate?.isActive ?? true,
  };
}

function toDraft(zone: AdminShippingZone | null, exponent: number): Draft {
  if (!zone) {
    return {
      name: "",
      countryCodes: [],
      isActive: true,
      sortOrder: "0",
      rates: [{ ...toRateDraft(null, exponent), code: "standard", label: "Standard", isDefault: true }],
    };
  }
  return {
    name: zone.name,
    countryCodes: [...zone.countryCodes],
    isActive: zone.isActive,
    sortOrder: String(zone.sortOrder),
    rates: zone.rates.map((rate) => toRateDraft(rate, exponent)),
  };
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

/** "4,95" and "4.95" both mean 4.95; blank is `null`, garbage is `undefined`. */
function parseAmount(text: string, exponent: number): number | null | undefined {
  const raw = text.trim().replace(",", ".");
  if (raw === "") return null;
  return parseMajorUnitsToMinor(raw, exponent) ?? undefined;
}

function parseDays(text: string): number | null | undefined {
  const raw = text.trim();
  if (raw === "") return null;
  return /^\d{1,3}$/.test(raw) ? Number.parseInt(raw, 10) : undefined;
}

/** Turns the draft into the API body, or returns the first problem found. */
function toInput(
  draft: Draft,
  exponent: number,
): { input: AdminShippingZoneInput } | { error: string } {
  if (draft.countryCodes.length === 0) {
    return { error: "Choose at least one country." };
  }

  const rates: AdminShippingZoneInput["rates"] = [];

  for (const [index, rate] of draft.rates.entries()) {
    const name = rate.label.trim() || `Rate ${index + 1}`;
    const price = parseAmount(rate.price, exponent);
    const freeAbove = parseAmount(rate.freeAbove, exponent);
    const minSubtotal = parseAmount(rate.minSubtotal, exponent);
    const minDays = parseDays(rate.minDays);
    const maxDays = parseDays(rate.maxDays);

    if (!rate.label.trim()) return { error: `${name}: enter a name.` };
    if (price === null || price === undefined) {
      return { error: `${name}: enter a valid price (0 for free delivery).` };
    }
    if (freeAbove === undefined) return { error: `${name}: "Free from" is not a valid amount.` };
    if (minSubtotal === undefined) {
      return { error: `${name}: "Minimum order" is not a valid amount.` };
    }
    if (minDays === undefined || maxDays === undefined) {
      return { error: `${name}: delivery days must be whole numbers.` };
    }

    rates.push({
      id: rate.id,
      code: rate.code.trim() || slugify(rate.label) || `rate-${index + 1}`,
      label: rate.label.trim(),
      description: rate.description.trim() || null,
      priceAmount: price,
      minSubtotalAmount: minSubtotal,
      freeAboveAmount: freeAbove,
      estimateMinDays: minDays,
      estimateMaxDays: maxDays,
      isDefault: rate.isDefault,
      isActive: rate.isActive,
    });
  }

  const sortOrder = Number.parseInt(draft.sortOrder, 10);

  return {
    input: {
      name: draft.name.trim(),
      countryCodes: draft.countryCodes,
      isActive: draft.isActive,
      sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
      rates,
    },
  };
}

function countrySummary(codes: readonly string[], locale: string): string {
  const names = codes.map((code) =>
    code === CATCH_ALL ? "All other countries" : (countryName(code, locale) ?? code),
  );
  if (names.length <= 4) return names.join(", ");
  return `${names.slice(0, 3).join(", ")} +${names.length - 3} more`;
}

function rateSummary(rate: AdminShippingRate): string {
  let text = `${rate.label}: ${rate.price.amount === 0 ? "Free" : rate.price.formatted}`;
  if (rate.freeAbove) text += `, free from ${rate.freeAbove.formatted}`;
  return text;
}

const inputBox = "h-9 text-sm";

export function ShippingZoneManager({
  zones,
  currency,
  minorUnitExponent,
  locale,
}: {
  zones: readonly AdminShippingZone[];
  currency: string;
  minorUnitExponent: number;
  locale: string;
}) {
  const router = useRouter();

  const [editing, setEditing] = React.useState<{
    open: boolean;
    zone: AdminShippingZone | null;
  }>({ open: false, zone: null });
  const [draft, setDraft] = React.useState<Draft>(() => toDraft(null, minorUnitExponent));
  const [saving, setSaving] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const [deleting, setDeleting] = React.useState<AdminShippingZone | null>(null);
  const [deleteBusy, setDeleteBusy] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  const deliversSomewhere = zones.some(
    (zone) => zone.isActive && zone.rates.some((rate) => rate.isActive),
  );

  // Country code -> name of the OTHER zone that already has it.
  const takenBy = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const zone of zones) {
      if (zone.id === editing.zone?.id) continue;
      for (const code of zone.countryCodes) map.set(code, zone.name);
    }
    return map;
  }, [zones, editing.zone]);

  function open(zone: AdminShippingZone | null) {
    setDraft(toDraft(zone, minorUnitExponent));
    setFormError(null);
    setEditing({ open: true, zone });
  }

  function patchRate(key: number, patch: Partial<RateDraft>) {
    setDraft((current) => ({
      ...current,
      rates: current.rates.map((rate) => {
        if (rate.key === key) return { ...rate, ...patch };
        // Only one default per zone.
        return patch.isDefault ? { ...rate, isDefault: false } : rate;
      }),
    }));
  }

  async function save() {
    const built = toInput(draft, minorUnitExponent);
    if ("error" in built) {
      setFormError(built.error);
      return;
    }

    setSaving(true);
    setFormError(null);
    const result = await saveShippingZoneAction(editing.zone?.id ?? null, built.input);
    setSaving(false);

    if (!result.ok) {
      const details = flattenFieldErrors(result.error.errors);
      setFormError(details.length > 0 ? details.join(" ") : result.error.message);
      return;
    }

    setEditing({ open: false, zone: null });
    toast.success(editing.zone ? "Shipping zone saved." : "Shipping zone created.");
    router.refresh();
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    setDeleteError(null);

    const result = await deleteShippingZoneAction(deleting.id);
    setDeleteBusy(false);

    if (!result.ok) {
      setDeleteError(result.error.message);
      return;
    }

    setDeleting(null);
    toast.success("Shipping zone deleted.");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {!deliversSomewhere ? (
        <Alert tone="warning" title="Checkout cannot deliver anywhere">
          No active zone has an active rate, so every order is blocked at the delivery step.
          Add a zone for the countries you ship to.
        </Alert>
      ) : null}

      <div className="flex justify-end">
        <Button onClick={() => open(null)}>
          <Plus className="size-4" aria-hidden="true" />
          New zone
        </Button>
      </div>

      {zones.length === 0 ? (
        <EmptyState
          title="No shipping zones yet"
          description="A zone is a group of countries that share the same delivery rates."
          action={<Button onClick={() => open(null)}>New zone</Button>}
        />
      ) : (
        <AdminTableWrap>
          <thead>
            <tr>
              <Th>Zone</Th>
              <Th>Countries</Th>
              <Th>Rates ({currency})</Th>
              <Th>Status</Th>
              <Th>
                <span className="sr-only">Actions</span>
              </Th>
            </tr>
          </thead>
          <tbody>
            {zones.map((zone) => (
              <tr key={zone.id}>
                <Td>
                  <span className="font-medium text-ink">{zone.name}</span>
                </Td>
                <Td>
                  <span className="text-sm">{countrySummary(zone.countryCodes, locale)}</span>
                </Td>
                <Td>
                  {zone.rates.length === 0 ? (
                    <span className="text-sm text-danger">No rates: blocked at checkout</span>
                  ) : (
                    <ul className="space-y-0.5 text-sm">
                      {zone.rates.map((rate) => (
                        <li key={rate.id} className={rate.isActive ? "" : "text-ink-subtle line-through"}>
                          {rateSummary(rate)}
                        </li>
                      ))}
                    </ul>
                  )}
                </Td>
                <Td>
                  <Badge tone={zone.isActive ? "success" : "neutral"}>
                    {zone.isActive ? "Active" : "Off"}
                  </Badge>
                </Td>
                <Td className="text-right">
                  <div className="flex justify-end gap-1.5">
                    <Button size="sm" variant="secondary" onClick={() => open(zone)}>
                      <Pencil className="size-4" aria-hidden="true" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-danger"
                      onClick={() => {
                        setDeleteError(null);
                        setDeleting(zone);
                      }}
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                      Delete
                    </Button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </AdminTableWrap>
      )}

      <Dialog
        open={editing.open}
        onOpenChange={(isOpen) => setEditing((state) => ({ ...state, open: isOpen }))}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editing.zone ? "Edit shipping zone" : "New shipping zone"}</DialogTitle>
            <DialogDescription>
              Customers in these countries see these rates at checkout. Prices are in {currency}.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-6">
            {formError ? (
              <Alert tone="danger" live title="The zone was not saved">
                {formError}
              </Alert>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
              <FormField id="zone-name" label="Zone name" required>
                {(field) => (
                  <Input
                    {...field}
                    placeholder="e.g. Belgium, or European Union"
                    value={draft.name}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, name: event.target.value }))
                    }
                  />
                )}
              </FormField>
              <FormField id="zone-sort" label="Sort order">
                {(field) => (
                  <Input
                    {...field}
                    inputMode="numeric"
                    value={draft.sortOrder}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, sortOrder: event.target.value }))
                    }
                  />
                )}
              </FormField>
            </div>

            <CountryPicker
              value={draft.countryCodes}
              onChange={(countryCodes) => setDraft((current) => ({ ...current, countryCodes }))}
              takenBy={takenBy}
              locale={locale}
            />

            <section className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-ink">Delivery rates</h3>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    setDraft((current) => ({
                      ...current,
                      rates: [
                        ...current.rates,
                        { ...toRateDraft(null, minorUnitExponent), isDefault: current.rates.length === 0 },
                      ],
                    }))
                  }
                  disabled={draft.rates.length >= 20}
                >
                  <Plus className="size-4" aria-hidden="true" />
                  Add rate
                </Button>
              </div>

              {draft.rates.length === 0 ? (
                <p className="text-sm text-danger">
                  Without a rate, checkout stays blocked for these countries.
                </p>
              ) : null}

              {draft.rates.map((rate, index) => (
                <RateEditor
                  key={rate.key}
                  index={index}
                  rate={rate}
                  currency={currency}
                  onChange={(patch) => patchRate(rate.key, patch)}
                  onRemove={() =>
                    setDraft((current) => ({
                      ...current,
                      rates: current.rates.filter((item) => item.key !== rate.key),
                    }))
                  }
                />
              ))}
            </section>

            <CheckboxField
              id="zone-active"
              label="Zone is active"
              checked={draft.isActive}
              onCheckedChange={(checked) =>
                setDraft((current) => ({ ...current, isActive: checked === true }))
              }
            />
          </DialogBody>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing({ open: false, zone: null })}>
              Cancel
            </Button>
            <Button loading={saving} loadingLabel="Saving…" onClick={() => void save()}>
              {editing.zone ? "Save zone" : "Create zone"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(isOpen) => (isOpen ? null : setDeleting(null))}
        title="Delete this shipping zone?"
        recordName={deleting?.name ?? ""}
        description="Its rates are deleted too, and checkout stops delivering to its countries. Existing orders are not affected."
        confirmLabel="Delete zone"
        busy={deleteBusy}
        error={deleteError}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}

function CountryPicker({
  value,
  onChange,
  takenBy,
  locale,
}: {
  value: string[];
  onChange: (codes: string[]) => void;
  takenBy: ReadonlyMap<string, string>;
  locale: string;
}) {
  const [query, setQuery] = React.useState("");
  const options = React.useMemo(() => countryOptions(locale), [locale]);
  const selected = new Set(value);

  const needle = query.trim().toLowerCase();
  const visible = needle
    ? options.filter(
        (option) =>
          option.name.toLowerCase().includes(needle) || option.code.toLowerCase() === needle,
      )
    : options;

  function toggle(code: string, on: boolean) {
    onChange(on ? [...value, code] : value.filter((item) => item !== code));
  }

  function addEu() {
    const free = EU_CODES.filter((code) => !selected.has(code) && !takenBy.has(code));
    onChange([...value, ...free]);
  }

  const catchAllOwner = takenBy.get(CATCH_ALL);

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-semibold text-ink">
        Countries <span className="font-normal text-ink-muted">({value.length} selected)</span>
      </legend>

      {value.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5">
          {value.map((code) => (
            <li key={code}>
              <button
                type="button"
                onClick={() => toggle(code, false)}
                className="inline-flex items-center gap-1 rounded-full border border-line bg-surface-high px-2.5 py-1 text-xs text-ink hover:border-danger-line"
                aria-label={`Remove ${code === CATCH_ALL ? "all other countries" : countryName(code, locale)}`}
              >
                {code === CATCH_ALL ? "All other countries" : countryName(code, locale)}
                <X className="size-3" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" onClick={addEu}>
          Add EU countries
        </Button>
        {value.length > 0 ? (
          <Button size="sm" variant="ghost" onClick={() => onChange([])}>
            Clear
          </Button>
        ) : null}
      </div>

      <label className="flex items-start gap-2 text-sm text-ink">
        <input
          type="checkbox"
          className="mt-0.5 size-4"
          checked={selected.has(CATCH_ALL)}
          disabled={catchAllOwner !== undefined}
          onChange={(event) => toggle(CATCH_ALL, event.target.checked)}
        />
        <span>
          All other countries (*)
          <span className="block text-xs text-ink-muted">
            {catchAllOwner
              ? `Already used by "${catchAllOwner}".`
              : "Covers every country that no other zone lists."}
          </span>
        </span>
      </label>

      <Input
        type="search"
        aria-label="Search countries"
        placeholder="Search countries…"
        className={inputBox}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />

      <ul className="max-h-56 overflow-y-auto rounded-md border border-line p-1">
        {visible.map((option) => {
          const owner = takenBy.get(option.code);
          return (
            <li key={option.code}>
              <label
                className={`flex items-center gap-2 rounded px-2 py-1.5 text-sm ${owner ? "text-ink-subtle" : "text-ink hover:bg-sunken"}`}
              >
                <input
                  type="checkbox"
                  className="size-4"
                  checked={selected.has(option.code)}
                  disabled={owner !== undefined}
                  onChange={(event) => toggle(option.code, event.target.checked)}
                />
                <span className="flex-1">{option.name}</span>
                <span className="text-xs text-ink-muted">
                  {owner ? `in "${owner}"` : option.code}
                </span>
              </label>
            </li>
          );
        })}
        {visible.length === 0 ? (
          <li className="px-2 py-1.5 text-sm text-ink-muted">No country matches.</li>
        ) : null}
      </ul>
    </fieldset>
  );
}

function RateEditor({
  index,
  rate,
  currency,
  onChange,
  onRemove,
}: {
  index: number;
  rate: RateDraft;
  currency: string;
  onChange: (patch: Partial<RateDraft>) => void;
  onRemove: () => void;
}) {
  const id = `rate-${rate.key}`;

  return (
    <div className="space-y-3 rounded-lg border border-line p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-ink-muted">
          Rate {index + 1}
        </span>
        <Button size="sm" variant="ghost" className="text-danger" onClick={onRemove}>
          <Trash2 className="size-4" aria-hidden="true" />
          Remove
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <FormField id={`${id}-label`} label="Name shown at checkout" required>
          {(field) => (
            <Input
              {...field}
              className={inputBox}
              placeholder="e.g. Standard, Express, Pick-up point"
              value={rate.label}
              onChange={(event) => onChange({ label: event.target.value })}
            />
          )}
        </FormField>
        <FormField id={`${id}-price`} label={`Price (${currency})`} required>
          {(field) => (
            <Input
              {...field}
              className={inputBox}
              inputMode="decimal"
              placeholder="4.95"
              value={rate.price}
              onChange={(event) => onChange({ price: event.target.value })}
            />
          )}
        </FormField>
      </div>

      <FormField id={`${id}-description`} label="Description">
        {(field) => (
          <Input
            {...field}
            className={inputBox}
            placeholder="e.g. Delivered by bpost"
            value={rate.description}
            onChange={(event) => onChange({ description: event.target.value })}
          />
        )}
      </FormField>

      <div className="grid gap-3 sm:grid-cols-4">
        <FormField id={`${id}-free`} label="Free from" description="Order total; blank = never">
          {(field) => (
            <Input
              {...field}
              className={inputBox}
              inputMode="decimal"
              value={rate.freeAbove}
              onChange={(event) => onChange({ freeAbove: event.target.value })}
            />
          )}
        </FormField>
        <FormField id={`${id}-min`} label="Minimum order" description="Blank = any order">
          {(field) => (
            <Input
              {...field}
              className={inputBox}
              inputMode="decimal"
              value={rate.minSubtotal}
              onChange={(event) => onChange({ minSubtotal: event.target.value })}
            />
          )}
        </FormField>
        <FormField id={`${id}-days-min`} label="Days (from)" description="Business days">
          {(field) => (
            <Input
              {...field}
              className={inputBox}
              inputMode="numeric"
              value={rate.minDays}
              onChange={(event) => onChange({ minDays: event.target.value })}
            />
          )}
        </FormField>
        <FormField id={`${id}-days-max`} label="Days (to)" description="Blank = not shown">
          {(field) => (
            <Input
              {...field}
              className={inputBox}
              inputMode="numeric"
              value={rate.maxDays}
              onChange={(event) => onChange({ maxDays: event.target.value })}
            />
          )}
        </FormField>
      </div>

      <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
        <FormField
          id={`${id}-code`}
          label="Code"
          description="Internal id; blank = from the name"
          className="w-48"
        >
          {(field) => (
            <Input
              {...field}
              className={inputBox}
              value={rate.code}
              onChange={(event) => onChange({ code: event.target.value })}
            />
          )}
        </FormField>
        <CheckboxField
          id={`${id}-default`}
          label="Pre-selected at checkout"
          checked={rate.isDefault}
          onCheckedChange={(checked) => onChange({ isDefault: checked === true })}
        />
        <CheckboxField
          id={`${id}-active`}
          label="Active"
          checked={rate.isActive}
          onCheckedChange={(checked) => onChange({ isActive: checked === true })}
        />
      </div>
    </div>
  );
}
