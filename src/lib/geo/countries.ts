/**
 * ISO-3166-1 alpha-2 country codes.
 *
 * This is a reference standard, not store data: the API takes `countryCode`
 * (ISO-3166-1 alpha-2, contract 5) and the customer has to be able to pick
 * one. Display names come from `Intl.DisplayNames` so nothing is hand-written
 * or translated here, and the list is never used to imply that the store ships
 * anywhere - `GET /shipping/options` decides that, per destination.
 */

const CODES =
  "AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ " +
  "CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO " +
  "FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE " +
  "JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO " +
  "MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW " +
  "PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM " +
  "TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW";

export const COUNTRY_CODES: readonly string[] = CODES.split(" ");

export interface CountryOption {
  code: string;
  name: string;
}

/**
 * Localized, alphabetically sorted country options.
 *
 * `Intl.DisplayNames` is unavailable in some runtimes; the code itself is then
 * shown rather than an English fallback invented here.
 */
export function countryOptions(locale = "en-US"): CountryOption[] {
  let display: Intl.DisplayNames | null = null;
  try {
    display = new Intl.DisplayNames([locale], { type: "region" });
  } catch {
    display = null;
  }

  const options = COUNTRY_CODES.map((code) => {
    let name = code;
    if (display) {
      try {
        name = display.of(code) ?? code;
      } catch {
        name = code;
      }
    }
    return { code, name };
  });

  return options.sort((a, b) => a.name.localeCompare(b.name, locale));
}

export function isCountryCode(value: string | null | undefined): boolean {
  if (typeof value !== "string") return false;
  return COUNTRY_CODES.includes(value.toUpperCase());
}

/** Single country name for display, falling back to the code. */
export function countryName(code: string | null | undefined, locale = "en-US"): string | null {
  if (!code) return null;
  try {
    return new Intl.DisplayNames([locale], { type: "region" }).of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}
