"use client";

import * as React from "react";
import { useFormContext } from "react-hook-form";

import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import type { CountryOption } from "@/lib/geo/countries";

/**
 * Postal address fields, shared by the account address book and checkout.
 *
 * Field names match the API body exactly (`line1`, `postalCode`,
 * `countryCode`, …) and `prefix` lets the same block live under
 * `shippingAddress` / `billingAddress`. That alignment is what makes a 422
 * `errors` key such as `shippingAddress.postalCode` land on the right input
 * with no translation layer (contract 1.3).
 *
 * The country control is a native `<select>`: it is the most reliable picker
 * for a ~250 item list on a phone, and it keeps keyboard and screen-reader
 * behaviour native.
 */

export interface AddressFieldsProps {
  /** e.g. `shippingAddress`, or empty for a top-level address form. */
  prefix?: string;
  idPrefix: string;
  countries: readonly CountryOption[];
  disabled?: boolean;
  /** Called when the country changes, so checkout can reload shipping options. */
  onCountryChange?: (countryCode: string) => void;
}

/** Walks a dotted path through react-hook-form's nested error object. */
function messageAt(errors: unknown, path: string): string | null {
  let cursor: unknown = errors;
  for (const segment of path.split(".")) {
    if (!cursor || typeof cursor !== "object") return null;
    cursor = (cursor as Record<string, unknown>)[segment];
  }
  if (cursor && typeof cursor === "object" && "message" in cursor) {
    const message = (cursor as { message?: unknown }).message;
    return typeof message === "string" ? message : null;
  }
  return null;
}

export function AddressFields({
  prefix,
  idPrefix,
  countries,
  disabled,
  onCountryChange,
}: AddressFieldsProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  const name = React.useCallback(
    (field: string) => (prefix ? `${prefix}.${field}` : field),
    [prefix],
  );
  const errorFor = (field: string) => messageAt(errors, name(field));
  const id = (field: string) => `${idPrefix}-${field}`;

  const countryRegistration = register(name("countryCode"));

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <FormField id={id("firstName")} label="First name" required error={errorFor("firstName")}>
        {(field) => (
          <Input
            {...field}
            autoComplete="given-name"
            disabled={disabled}
            {...register(name("firstName"))}
          />
        )}
      </FormField>

      <FormField id={id("lastName")} label="Last name" required error={errorFor("lastName")}>
        {(field) => (
          <Input
            {...field}
            autoComplete="family-name"
            disabled={disabled}
            {...register(name("lastName"))}
          />
        )}
      </FormField>

      <FormField
        id={id("company")}
        label="Company"
        description="Optional"
        error={errorFor("company")}
        className="sm:col-span-2"
      >
        {(field) => (
          <Input
            {...field}
            autoComplete="organization"
            disabled={disabled}
            {...register(name("company"))}
          />
        )}
      </FormField>

      <FormField
        id={id("line1")}
        label="Address"
        required
        error={errorFor("line1")}
        className="sm:col-span-2"
      >
        {(field) => (
          <Input
            {...field}
            autoComplete="address-line1"
            disabled={disabled}
            {...register(name("line1"))}
          />
        )}
      </FormField>

      <FormField
        id={id("line2")}
        label="Apartment, suite, etc."
        description="Optional"
        error={errorFor("line2")}
        className="sm:col-span-2"
      >
        {(field) => (
          <Input
            {...field}
            autoComplete="address-line2"
            disabled={disabled}
            {...register(name("line2"))}
          />
        )}
      </FormField>

      <FormField id={id("city")} label="City" required error={errorFor("city")}>
        {(field) => (
          <Input
            {...field}
            autoComplete="address-level2"
            disabled={disabled}
            {...register(name("city"))}
          />
        )}
      </FormField>

      <FormField
        id={id("region")}
        label="State or region"
        description="Optional"
        error={errorFor("region")}
      >
        {(field) => (
          <Input
            {...field}
            autoComplete="address-level1"
            disabled={disabled}
            {...register(name("region"))}
          />
        )}
      </FormField>

      <FormField id={id("postalCode")} label="Postal code" required error={errorFor("postalCode")}>
        {(field) => (
          <Input
            {...field}
            autoComplete="postal-code"
            inputMode="text"
            disabled={disabled}
            {...register(name("postalCode"))}
          />
        )}
      </FormField>

      <FormField id={id("countryCode")} label="Country" required error={errorFor("countryCode")}>
        {(field) => (
          <select
            {...field}
            autoComplete="country"
            disabled={disabled}
            className="h-11 w-full rounded-md border border-line-strong bg-surface px-3 text-sm text-ink transition-colors hover:border-ink-subtle disabled:cursor-not-allowed disabled:bg-sunken disabled:text-ink-subtle"
            {...countryRegistration}
            onChange={(event) => {
              void countryRegistration.onChange(event);
              onCountryChange?.(event.currentTarget.value);
            }}
          >
            <option value="">Select a country</option>
            {countries.map((country) => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </select>
        )}
      </FormField>

      <FormField
        id={id("phone")}
        label="Phone"
        description="Optional. Used only if there is a delivery problem."
        error={errorFor("phone")}
        className="sm:col-span-2"
      >
        {(field) => (
          <Input
            {...field}
            type="tel"
            autoComplete="tel"
            disabled={disabled}
            {...register(name("phone"))}
          />
        )}
      </FormField>
    </div>
  );
}

/** Shared zod shape for an address, matching the API's field names and limits. */
export const ADDRESS_FIELD_NAMES = [
  "firstName",
  "lastName",
  "company",
  "line1",
  "line2",
  "city",
  "region",
  "postalCode",
  "countryCode",
  "phone",
] as const;
