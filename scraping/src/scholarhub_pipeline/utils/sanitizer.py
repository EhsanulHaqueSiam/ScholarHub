"""HTML sanitization for scraped content.

Strips all HTML tags from scraped descriptions and other text fields.
Defense-in-depth: sanitize on scrape AND on frontend display.
"""

from __future__ import annotations

import re

import bleach

# Strip ALL tags on scrape -- no allowed tags in pipeline output.
ALLOWED_TAGS: list[str] = []


def sanitize_html(html: str) -> str:
    """Strip all HTML tags from a string, returning clean text.

    Removes script/style tags AND their content, then strips remaining tags.
    Also normalizes whitespace (collapses multiple spaces/newlines to single space).

    Args:
        html: Raw HTML string to sanitize.

    Returns:
        Clean text with all HTML tags removed and whitespace normalized.
        Empty string if input is empty or None-like.
    """
    if not html:
        return ""
    # Remove script and style tags including their content
    cleaned = re.sub(r"<(script|style)[^>]*>.*?</\1>", "", html, flags=re.DOTALL | re.IGNORECASE)
    # Strip remaining HTML tags
    cleaned = bleach.clean(cleaned, tags=ALLOWED_TAGS, strip=True)
    # Normalize whitespace: collapse runs of whitespace to single space
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned
