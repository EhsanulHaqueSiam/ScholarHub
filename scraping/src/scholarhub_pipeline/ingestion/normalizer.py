"""Data normalization for scraped scholarship records.

Normalizes country names to ISO 3166-1 alpha-2 codes, dates to ISO 8601,
and currency strings to ISO 4217 codes.
"""

from __future__ import annotations

from typing import Any

import pycountry
from dateutil import parser as dateutil_parser
from dateutil.parser import ParserError

# Manual overrides for common country name variants that pycountry
# doesn't resolve via fuzzy search.
_COUNTRY_OVERRIDES: dict[str, str] = {
    "UK": "GB",
    "USA": "US",
    "South Korea": "KR",
    "Russia": "RU",
    "Taiwan": "TW",
    "Hong Kong": "HK",
    "Macau": "MO",
}

# Currency lookup table: common names/symbols -> ISO 4217 codes.
# Keys are lowercased for case-insensitive matching.
_CURRENCY_MAP: dict[str, str] = {
    "$": "USD",
    "dollar": "USD",
    "dollars": "USD",
    "usd": "USD",
    "euro": "EUR",
    "euros": "EUR",
    "eur": "EUR",
    "pound": "GBP",
    "pounds": "GBP",
    "gbp": "GBP",
    "yen": "JPY",
    "jpy": "JPY",
    "won": "KRW",
    "krw": "KRW",
    "chf": "CHF",
    "aud": "AUD",
    "cad": "CAD",
    "sek": "SEK",
    "nok": "NOK",
    "dkk": "DKK",
    "cny": "CNY",
}


def normalize_country(name: str) -> str:
    """Normalize a country name to its ISO 3166-1 alpha-2 code.

    Uses manual overrides first, then pycountry fuzzy search.
    Returns the original string if the country cannot be resolved.

    Args:
        name: Country name string (e.g. "Germany", "UK", "South Korea").

    Returns:
        ISO alpha-2 code (e.g. "DE", "GB", "KR") or the original string on failure.
    """
    if not name:
        return name

    # Check manual overrides first
    if name in _COUNTRY_OVERRIDES:
        return _COUNTRY_OVERRIDES[name]

    # Try pycountry fuzzy search
    try:
        results = pycountry.countries.search_fuzzy(name)
        if results:
            return results[0].alpha_2
    except LookupError:
        pass

    return name


def normalize_date(date_str: str | None) -> str | None:
    """Parse a date string into ISO 8601 format (YYYY-MM-DD).

    Handles various formats: "December 31, 2026", "31/12/2026",
    "2026-12-31T23:59:59Z", etc. Returns None for unparseable strings.

    Args:
        date_str: Date string to parse, or None.

    Returns:
        ISO date string (e.g. "2026-12-31") or None if unparseable.
    """
    if not date_str:
        return None

    try:
        parsed = dateutil_parser.parse(date_str, dayfirst=True)
        return parsed.strftime("%Y-%m-%d")
    except (ParserError, ValueError, OverflowError):
        return None


def normalize_currency(currency_str: str) -> str:
    """Normalize a currency string to its ISO 4217 code.

    Case-insensitive lookup. Returns the original string if not recognized.

    Args:
        currency_str: Currency string (e.g. "$", "euro", "EUR", "pounds").

    Returns:
        ISO 4217 code (e.g. "USD", "EUR", "GBP") or the original string.
    """
    if not currency_str:
        return currency_str

    return _CURRENCY_MAP.get(currency_str.lower(), currency_str)


def normalize_record(record: dict[str, Any]) -> dict[str, Any]:
    """Apply all normalizations to a raw record.

    Normalizes host_country, application_deadline, and award_currency fields.
    Does not mutate the original record.

    Args:
        record: Raw scraped record dict.

    Returns:
        New dict with normalized field values.
    """
    result = dict(record)

    if "host_country" in result and result["host_country"]:
        result["host_country"] = normalize_country(result["host_country"])

    if "application_deadline" in result and result["application_deadline"]:
        result["application_deadline"] = normalize_date(result["application_deadline"])

    if "award_currency" in result and result["award_currency"]:
        result["award_currency"] = normalize_currency(result["award_currency"])

    return result
