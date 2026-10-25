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

/** The validation messages, supplied by the caller in the page's language. */
export interface AddressErrorMessages {
  firstName: string;
  lastName: string;
  line1: string;
  city: string;
  postalCode: string;
  country: string;
}

const ENGLISH_ERRORS: AddressErrorMessages = {
  firstName: "Enter a first name.",
  lastName: "Enter a last name.",
  line1: "Enter a street address.",
  city: "Enter a city.",
  postalCode: "Enter a postal code.",
  country: "Select a country.",
};

/**
 * The address schema with messages in a given language. Forms build it from
 * the dictionary (`m.address.errors`) so a Dutch visitor reads Dutch errors;
 * the rules themselves are identical in every language.
 */
export function createAddressSchema(t: AddressErrorMessages = ENGLISH_ERRORS) {
  return z.object({
    firstName: z.string().trim().min(1, t.firstName).max(120),
    lastName: z.string().trim().min(1, t.lastName).max(120),
    company: z.string().trim().max(160),
    line1: z.string().trim().min(1, t.line1).max(255),
    line2: z.string().trim().max(255),
    city: z.string().trim().min(1, t.city).max(120),
    region: z.string().trim().max(120),
    postalCode: z.string().trim().min(1, t.postalCode).max(32),
    countryCode: z
      .string()
      .trim()
      .min(1, t.country)
      .refine((value) => isCountryCode(value), t.country),
    phone: z.string().trim().max(32),
  });
}

/** The English schema, for callers without a dictionary. */
export const addressSchema = createAddressSchema();

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
