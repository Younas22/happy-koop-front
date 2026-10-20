import { z } from "zod";

import { isCountryCode } from "@/lib/geo/countries";
import type { Address } from "@/lib/types/api";

/**
 * Address validation, mirroring the API's own rules (contract 5 / 7):
 * required first/last name, line1, city, postalCode and a 2-letter ISO
 * country; everything else optional. Limits match the backend so a form that
 * passes here is not then rejected for length.
 *
 * The schema deliberately has NO transforms: react-hook-form holds plain
 * strings, and `toAddressPayload` converts empty optional inputs to `null`,
 * which is what the API expects for "no value" (contract 1.7).
 */

export const addressSchema = z.object({
  firstName: z.string().trim().min(1, "Enter a first name.").max(120),
  lastName: z.string().trim().min(1, "Enter a last name.").max(120),
  company: z.string().trim().max(160),
  line1: z.string().trim().min(1, "Enter a street address.").max(255),
  line2: z.string().trim().max(255),
  city: z.string().trim().min(1, "Enter a city.").max(120),
  region: z.string().trim().max(120),
  postalCode: z.string().trim().min(1, "Enter a postal code.").max(32),
  countryCode: z
    .string()
    .trim()
    .min(1, "Select a country.")
    .refine((value) => isCountryCode(value), "Select a country."),
  phone: z.string().trim().max(32),
});

export type AddressFormValues = z.infer<typeof addressSchema>;

function orNull(value: string | undefined): string | null {
  const trimmed = (value ?? "").trim();
  return trimmed === "" ? null : trimmed;
}

/** Form values -> the API's address body. */
export function toAddressPayload(values: AddressFormValues): Address {
  return {
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    company: orNull(values.company),
    line1: values.line1.trim(),
    line2: orNull(values.line2),
    city: values.city.trim(),
    region: orNull(values.region),
    postalCode: values.postalCode.trim(),
    countryCode: values.countryCode.trim().toUpperCase(),
    phone: orNull(values.phone),
  };
}

/** Blank defaults for a new address form. */
export function emptyAddress(countryCode = ""): AddressFormValues {
  return {
    firstName: "",
    lastName: "",
    company: "",
    line1: "",
    line2: "",
    city: "",
    region: "",
    postalCode: "",
    countryCode,
    phone: "",
  };
}
