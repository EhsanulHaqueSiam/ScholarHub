import countries from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";

countries.registerLocale(enLocale);

/** Flag emoji from ISO 3166-1 alpha-2 code */
export function getCountryFlag(code: string): string {
  const upper = code.toUpperCase();
  return String.fromCodePoint(...[...upper].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

/** Country name from ISO code */
export function getCountryName(code: string): string {
  return countries.getName(code.toUpperCase(), "en") ?? code;
}

/** ISO code from country name (for reverse lookup) */
export function getCountryCode(name: string): string | undefined {
  return countries.getAlpha2Code(name, "en") ?? undefined;
}

/** All countries as { code, name, flag } sorted by name */
export function getAllCountries(): Array<{
  code: string;
  name: string;
  flag: string;
}> {
  const all = countries.getAlpha2Codes();
  return Object.keys(all)
    .map((code) => ({
      code,
      name: getCountryName(code),
      flag: getCountryFlag(code),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Top 15 popular nationalities (most common international student origins) */
export const POPULAR_NATIONALITIES = [
  "BD",
  "IN",
  "CN",
  "NG",
  "PK",
  "ET",
  "GH",
  "KE",
  "NP",
  "VN",
  "EG",
  "ID",
  "PH",
  "LK",
  "TR",
];

/** Top 15 popular study destinations */
export const POPULAR_DESTINATIONS = [
  "US",
  "GB",
  "DE",
  "CA",
  "AU",
  "FR",
  "NL",
  "JP",
  "SE",
  "CH",
  "KR",
  "SG",
  "NZ",
  "IE",
  "DK",
];

/**
 * Parse host_country field into individual country codes.
 * Handles: "AU" (single), "AUTRCOVE" (concatenated pairs), "AU,TR,CO" (comma-separated),
 * "Australia" (full name), "Australia, Germany" (comma-separated names).
 * Returns array of 2-letter ISO codes.
 */
export function parseHostCountries(hostCountry: string): string[] {
  if (!hostCountry) return [];

  // Strip parentheses and trim
  const cleaned = hostCountry.replace(/[()]/g, "").trim();
  if (!cleaned) return [];

  // Skip generic values that don't identify a specific country
  const lower = cleaned.toLowerCase();
  if (
    lower === "all countries" ||
    lower === "international" ||
    lower === "worldwide" ||
    lower === "global"
  ) {
    return [];
  }

  // Single 2-letter code
  if (cleaned.length === 2) return [cleaned.toUpperCase()];

  // Comma-separated (codes or full names)
  if (cleaned.includes(",")) {
    return cleaned
      .split(",")
      .map((c) => c.trim())
      .map((c) => {
        if (c.length === 2) return c.toUpperCase();
        return getCountryCode(c) ?? "";
      })
      .filter((c) => c.length === 2);
  }

  // Concatenated 2-letter codes (e.g. "AUTRCOVE")
  const upper = cleaned.toUpperCase();
  if (upper.length >= 4 && upper.length % 2 === 0 && /^[A-Z]+$/.test(upper)) {
    const codes: string[] = [];
    for (let i = 0; i < upper.length; i += 2) {
      codes.push(upper.slice(i, i + 2));
    }
    return codes;
  }

  // Try full country name reverse lookup (e.g. "Australia" → "AU")
  const code = getCountryCode(cleaned);
  if (code) return [code];

  return [];
}

/** Timezone -> Country mapping for nationality auto-detection */
export const TIMEZONE_TO_COUNTRY: Record<string, string> = {
  "Asia/Dhaka": "BD",
  "Asia/Kolkata": "IN",
  "Asia/Calcutta": "IN",
  "Asia/Shanghai": "CN",
  "Asia/Beijing": "CN",
  "Africa/Lagos": "NG",
  "Asia/Karachi": "PK",
  "Africa/Addis_Ababa": "ET",
  "Africa/Accra": "GH",
  "Africa/Nairobi": "KE",
  "Asia/Kathmandu": "NP",
  "Asia/Ho_Chi_Minh": "VN",
  "Asia/Saigon": "VN",
  "Africa/Cairo": "EG",
  "Asia/Jakarta": "ID",
  "Asia/Manila": "PH",
  "Asia/Colombo": "LK",
  "Europe/Istanbul": "TR",
  "America/New_York": "US",
  "America/Chicago": "US",
  "America/Denver": "US",
  "America/Los_Angeles": "US",
  "America/Anchorage": "US",
  "Pacific/Honolulu": "US",
  "Europe/London": "GB",
  "Europe/Berlin": "DE",
  "Europe/Paris": "FR",
  "America/Toronto": "CA",
  "America/Vancouver": "CA",
  "Australia/Sydney": "AU",
  "Australia/Melbourne": "AU",
  "Australia/Perth": "AU",
  "Europe/Amsterdam": "NL",
  "Asia/Tokyo": "JP",
  "Europe/Stockholm": "SE",
  "Europe/Zurich": "CH",
  "Asia/Seoul": "KR",
  "Asia/Singapore": "SG",
  "Pacific/Auckland": "NZ",
  "Europe/Dublin": "IE",
  "Europe/Copenhagen": "DK",
  "Europe/Oslo": "NO",
  "Europe/Helsinki": "FI",
  "Europe/Vienna": "AT",
  "Europe/Brussels": "BE",
  "Asia/Hong_Kong": "HK",
  "Europe/Madrid": "ES",
  "Europe/Rome": "IT",
  "Europe/Lisbon": "PT",
  "Europe/Warsaw": "PL",
  "Europe/Prague": "CZ",
  "Europe/Budapest": "HU",
  "Europe/Athens": "GR",
  "Asia/Taipei": "TW",
  "America/Mexico_City": "MX",
  "America/Sao_Paulo": "BR",
  "America/Argentina/Buenos_Aires": "AR",
  "America/Santiago": "CL",
  "Asia/Bangkok": "TH",
  "Asia/Kuala_Lumpur": "MY",
  "Africa/Johannesburg": "ZA",
  "Europe/Moscow": "RU",
  "Asia/Riyadh": "SA",
  "Asia/Dubai": "AE",
  "Asia/Beirut": "LB",
  "Asia/Amman": "JO",
  "Africa/Tunis": "TN",
  "Africa/Casablanca": "MA",
  "Africa/Dar_es_Salaam": "TZ",
  "Africa/Kampala": "UG",
  "Africa/Lusaka": "ZM",
  "Africa/Harare": "ZW",
  "Asia/Yangon": "MM",
  "Asia/Phnom_Penh": "KH",
};
