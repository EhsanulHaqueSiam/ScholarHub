"""Base scraper class for all ScholarHub scraper types.

Provides shared logic for record processing, field mapping,
cutoff date checking, and normalization that all concrete
scrapers inherit.
"""

from __future__ import annotations

import abc
from datetime import datetime, timezone

import structlog
from dateutil.relativedelta import relativedelta

from scholarhub_pipeline.configs._protocol import SourceConfig
from scholarhub_pipeline.ingestion.normalizer import normalize_record
from scholarhub_pipeline.ingestion.quality import check_quality
from scholarhub_pipeline.utils.sanitizer import sanitize_html

logger = structlog.get_logger()


class BaseScraper(abc.ABC):
    """Base class for all scraper types.

    Subclasses must implement the ``scrape`` method to fetch and return
    raw records from their specific data source type.

    Attributes:
        config: The SourceConfig driving this scraper.
        records_found: Counter of records extracted so far.
        bytes_downloaded: Approximate bytes fetched from the source.
    """

    def __init__(self, config: SourceConfig) -> None:
        """Initialize the scraper with a source configuration.

        Args:
            config: SourceConfig protocol object for the target source.
        """
        self.config = config
        self.records_found: int = 0
        self.bytes_downloaded: int = 0
        self._cutoff_date = datetime.now(tz=timezone.utc) - relativedelta(
            months=config.cutoff_months,
        )

    @abc.abstractmethod
    async def scrape(self) -> list[dict]:
        """Execute scraping and return list of raw record dicts.

        Returns:
            List of normalized raw record dicts.
        """
        ...

    def process_record(self, raw: dict) -> dict:
        """Normalize, sanitize, and quality-check a single record.

        Args:
            raw: Extracted record dict with raw field values.

        Returns:
            Record dict with normalized values and quality_flags attached.
        """
        # Sanitize description HTML
        if "description" in raw and raw["description"]:
            raw["description"] = sanitize_html(raw["description"])
        # Normalize fields
        record = normalize_record(raw)
        # Add quality flags
        record["quality_flags"] = check_quality(record)
        return record

    def is_expired_beyond_cutoff(self, deadline_str: str | None) -> bool:
        """Return True if deadline is more than cutoff_months in the past.

        Args:
            deadline_str: Date string to check, or None.

        Returns:
            True if the deadline date is older than the cutoff date.
        """
        if not deadline_str:
            return False
        try:
            from dateutil.parser import parse

            deadline = parse(deadline_str)
            if deadline.tzinfo is None:
                deadline = deadline.replace(tzinfo=timezone.utc)
            return deadline < self._cutoff_date
        except Exception:  # noqa: BLE001
            return False

    @staticmethod
    def _get_nested(data: dict, dotted_key: str) -> object | None:
        """Resolve a dot-notation key like 'title.rendered' from a nested dict."""
        parts = dotted_key.split(".")
        current: object = data
        for part in parts:
            if isinstance(current, dict) and part in current:
                current = current[part]
            else:
                return None
        return current

    def apply_field_mappings(self, extracted: dict) -> dict:
        """Map extracted field names to raw_record schema field names.

        Uses the ``field_mappings`` dict from the source config to rename
        keys from the source-specific names to the canonical record fields.
        Supports dot-notation for nested fields (e.g., 'title.rendered').

        Args:
            extracted: Dict with source-specific field names.

        Returns:
            Dict with field names mapped to the canonical schema.
        """
        mapped: dict = {}
        for source_field, target_field in self.config.field_mappings.items():
            if "." in source_field:
                value = self._get_nested(extracted, source_field)
                if value is not None:
                    mapped[target_field] = value
            elif source_field in extracted:
                mapped[target_field] = extracted[source_field]
        return mapped
