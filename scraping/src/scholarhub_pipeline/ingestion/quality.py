"""Quality flag detection for scraped scholarship records.

Detects data quality issues and returns a list of flag strings
that can be attached to the record for downstream filtering.
"""

from __future__ import annotations

from scholarhub_pipeline.ingestion.normalizer import normalize_country, normalize_date

# Minimum thresholds for content quality checks.
_MIN_TITLE_LENGTH = 5
_MIN_DESCRIPTION_LENGTH = 20


def check_quality(record: dict[str, object]) -> list[str]:
    """Return a list of quality flag strings for issues found in the record.

    Checks for:
    - missing_title: title is empty or absent
    - missing_source_url: source_url is empty or absent
    - suspiciously_short_title: title length < 5 chars
    - suspiciously_short_description: description exists but length < 20 chars
    - unparseable_deadline: application_deadline is set but cannot be parsed
    - unrecognized_country: host_country is set but not a recognized country name

    Args:
        record: A raw scraped record dict.

    Returns:
        List of quality flag strings. Empty list if no issues.
    """
    flags: list[str] = []

    title = record.get("title", "")
    if not title:
        flags.append("missing_title")
    elif len(str(title)) < _MIN_TITLE_LENGTH:
        flags.append("suspiciously_short_title")

    source_url = record.get("source_url", "")
    if not source_url:
        flags.append("missing_source_url")

    description = record.get("description")
    if description and len(str(description)) < _MIN_DESCRIPTION_LENGTH:
        flags.append("suspiciously_short_description")

    deadline = record.get("application_deadline")
    if deadline and normalize_date(str(deadline)) is None:
        flags.append("unparseable_deadline")

    country = record.get("host_country")
    if country:
        normalized = normalize_country(str(country))
        # If normalize_country returns the same string, it was not recognized
        if normalized == country and len(country) > 2:
            flags.append("unrecognized_country")

    return flags
