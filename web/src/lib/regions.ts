/**
 * UN M49-based region mapping for country codes.
 * Used by EligibilitySection to group nationalities by region in the expanded view.
 */
export const REGION_MAP: Record<string, string> = {
  // Africa
  DZ: "Africa", AO: "Africa", BJ: "Africa", BW: "Africa", BF: "Africa",
  BI: "Africa", CM: "Africa", CV: "Africa", CF: "Africa", TD: "Africa",
  KM: "Africa", CG: "Africa", CD: "Africa", CI: "Africa", DJ: "Africa",
  EG: "Africa", GQ: "Africa", ER: "Africa", SZ: "Africa", ET: "Africa",
  GA: "Africa", GM: "Africa", GH: "Africa", GN: "Africa", GW: "Africa",
  KE: "Africa", LS: "Africa", LR: "Africa", LY: "Africa", MG: "Africa",
  MW: "Africa", ML: "Africa", MR: "Africa", MU: "Africa", MA: "Africa",
  MZ: "Africa", NA: "Africa", NE: "Africa", NG: "Africa", RW: "Africa",
  SN: "Africa", SC: "Africa", SL: "Africa", SO: "Africa", ZA: "Africa",
  SS: "Africa", SD: "Africa", TZ: "Africa", TG: "Africa", TN: "Africa",
  UG: "Africa", ZM: "Africa", ZW: "Africa",
  // Asia
  AF: "Asia", AM: "Asia", AZ: "Asia", BD: "Asia", BT: "Asia",
  BN: "Asia", KH: "Asia", CN: "Asia", GE: "Asia", IN: "Asia",
  ID: "Asia", JP: "Asia", KZ: "Asia", KG: "Asia", LA: "Asia",
  MY: "Asia", MV: "Asia", MN: "Asia", MM: "Asia", NP: "Asia",
  KP: "Asia", PK: "Asia", PH: "Asia", KR: "Asia", SG: "Asia",
  LK: "Asia", TW: "Asia", TJ: "Asia", TH: "Asia", TL: "Asia",
  TM: "Asia", UZ: "Asia", VN: "Asia",
  // Europe
  AL: "Europe", AD: "Europe", AT: "Europe", BY: "Europe", BE: "Europe",
  BA: "Europe", BG: "Europe", HR: "Europe", CY: "Europe", CZ: "Europe",
  DK: "Europe", EE: "Europe", FI: "Europe", FR: "Europe", DE: "Europe",
  GR: "Europe", HU: "Europe", IS: "Europe", IE: "Europe", IT: "Europe",
  XK: "Europe", LV: "Europe", LI: "Europe", LT: "Europe", LU: "Europe",
  MT: "Europe", MD: "Europe", MC: "Europe", ME: "Europe", NL: "Europe",
  MK: "Europe", NO: "Europe", PL: "Europe", PT: "Europe", RO: "Europe",
  RU: "Europe", SM: "Europe", RS: "Europe", SK: "Europe", SI: "Europe",
  ES: "Europe", SE: "Europe", CH: "Europe", UA: "Europe", GB: "Europe",
  VA: "Europe",
  // Americas
  AG: "Americas", AR: "Americas", BS: "Americas", BB: "Americas",
  BZ: "Americas", BO: "Americas", BR: "Americas", CA: "Americas",
  CL: "Americas", CO: "Americas", CR: "Americas", CU: "Americas",
  DM: "Americas", DO: "Americas", EC: "Americas", SV: "Americas",
  GD: "Americas", GT: "Americas", GY: "Americas", HT: "Americas",
  HN: "Americas", JM: "Americas", MX: "Americas", NI: "Americas",
  PA: "Americas", PY: "Americas", PE: "Americas", KN: "Americas",
  LC: "Americas", VC: "Americas", SR: "Americas", TT: "Americas",
  US: "Americas", UY: "Americas", VE: "Americas",
  // Oceania
  AU: "Oceania", FJ: "Oceania", NZ: "Oceania", PG: "Oceania",
  WS: "Oceania", SB: "Oceania", TO: "Oceania", VU: "Oceania",
  // Middle East
  BH: "Middle East", IR: "Middle East", IQ: "Middle East",
  IL: "Middle East", JO: "Middle East", KW: "Middle East",
  LB: "Middle East", OM: "Middle East", PS: "Middle East",
  QA: "Middle East", SA: "Middle East", SY: "Middle East",
  TR: "Middle East", AE: "Middle East", YE: "Middle East",
};

/** Get region name for a single country code. Returns "Other" for unknown codes. */
export function getRegion(countryCode: string): string {
  return REGION_MAP[countryCode.toUpperCase()] ?? "Other";
}

/** Group an array of ISO country codes by region. Returns Record<regionName, codes[]>. */
export function groupByRegion(
  countryCodes: string[],
): Record<string, string[]> {
  const groups: Record<string, string[]> = {};
  for (const code of countryCodes) {
    const region = getRegion(code);
    if (!groups[region]) groups[region] = [];
    groups[region].push(code);
  }
  // Sort regions alphabetically, with "Other" last
  const sorted: Record<string, string[]> = {};
  const keys = Object.keys(groups).sort((a, b) => {
    if (a === "Other") return 1;
    if (b === "Other") return -1;
    return a.localeCompare(b);
  });
  for (const key of keys) {
    sorted[key] = groups[key];
  }
  return sorted;
}
