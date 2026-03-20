"""Heuristic selector recovery for broken scraper configs.

When configured CSS selectors break (site redesign), tries common patterns
to find listing containers and field selectors. Not LLM-based -- purely
heuristic pattern matching against common scholarship site structures.
"""

from __future__ import annotations

from lxml import html as lxml_html
from lxml.cssselect import CSSSelector, SelectorSyntaxError

# Common CSS patterns for scholarship listing containers.
# Ordered by specificity: more specific patterns first.
COMMON_LISTING_PATTERNS: list[str] = [
    "table tr",
    ".scholarship-item",
    ".listing-card",
    "article",
    ".result-item",
    ".scholarship-card",
    ".card",
    ".listing",
    "[class*='scholarship']",
    "[class*='result']",
    "[class*='listing']",
    ".search-result",
    ".item",
    "li.result",
]

# Field-specific CSS patterns for extracting data from a single listing item.
FIELD_PATTERNS: dict[str, list[str]] = {
    "title": ["h2", "h3", ".title", "[class*='title']", "a[href]"],
    "deadline": [".deadline", "[class*='deadline']", "[class*='date']", "time"],
    "amount": [".amount", "[class*='amount']", "[class*='fund']", "[class*='value']"],
    "country": [".country", "[class*='country']", "[class*='location']"],
}

# Minimum number of matching elements to consider a pattern valid.
_MIN_LISTING_MATCHES = 3


def find_listing_selector(page_html: str) -> str | None:
    """Try common CSS patterns to find repeating scholarship items on a page.

    The heuristic: find the CSS selector that matches 3+ repeating elements,
    which likely represents the listing container.

    Args:
        page_html: Raw HTML string of the page.

    Returns:
        The first CSS selector that matches 3+ elements, or None if no pattern works.
    """
    if not page_html:
        return None

    try:
        doc = lxml_html.fromstring(page_html)
    except Exception:  # noqa: BLE001
        return None

    for pattern in COMMON_LISTING_PATTERNS:
        try:
            selector = CSSSelector(pattern)
            matches = selector(doc)
            if len(matches) >= _MIN_LISTING_MATCHES:
                return pattern
        except SelectorSyntaxError:
            continue

    return None


def find_field_selectors(item_html: str) -> dict[str, str]:
    """Given a single listing item's HTML, guess field selectors.

    Tries common patterns for title, deadline, amount, and country fields.
    Returns a mapping of field name to the first matching CSS selector.

    Args:
        item_html: HTML string of a single listing item.

    Returns:
        Dict mapping field names to CSS selectors that found content.
        Only includes fields where a match was found.
    """
    if not item_html:
        return {}

    try:
        doc = lxml_html.fromstring(item_html)
    except Exception:  # noqa: BLE001
        return {}

    found: dict[str, str] = {}

    for field, patterns in FIELD_PATTERNS.items():
        for pattern in patterns:
            try:
                selector = CSSSelector(pattern)
                matches = selector(doc)
                if matches and _has_text_content(matches[0]):
                    found[field] = pattern
                    break
            except SelectorSyntaxError:
                continue

    return found


def _has_text_content(element: lxml_html.HtmlElement) -> bool:
    """Check if an HTML element has non-empty text content.

    Args:
        element: An lxml HTML element.

    Returns:
        True if the element or its children contain non-whitespace text.
    """
    text = element.text_content()
    return bool(text and text.strip())
