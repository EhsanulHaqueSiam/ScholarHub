"""JSON-LD extractor for pages with structured data.

Extracts JSON-LD, Microdata, and OpenGraph structured data from
HTML pages using the extruct library. Maps schema.org types
(Scholarship, EducationalOccupationalProgram, Event) to the
raw_record schema.
"""

from __future__ import annotations

import asyncio
from typing import Any

import extruct
import httpx
import structlog

from scholarhub_pipeline.scrapers.base import BaseScraper
from scholarhub_pipeline.utils.ua_rotation import get_random_ua

logger = structlog.get_logger()

# Schema.org type mappings to raw_record fields.
_SCHEMA_TYPE_FIELD_MAPS: dict[str, dict[str, str]] = {
    "Scholarship": {
        "name": "title",
        "description": "description",
        "url": "source_url",
        "provider": "provider_name",
        "applicationDeadline": "application_deadline",
        "eligibleRegion": "host_country",
        "amount": "award_amount",
    },
    "EducationalOccupationalProgram": {
        "name": "title",
        "description": "description",
        "url": "source_url",
        "provider": "provider_name",
        "applicationDeadline": "application_deadline",
    },
    "Event": {
        "name": "title",
        "description": "description",
        "url": "source_url",
        "organizer": "provider_name",
        "startDate": "application_deadline",
        "location": "host_country",
    },
}


class JsonLdExtractor(BaseScraper):
    """Extract structured data (JSON-LD, microdata, RDFa) from pages.

    Uses extruct to parse embedded structured data and maps schema.org
    properties to the raw_record schema fields.
    """

    async def scrape(self) -> list[dict]:
        """Fetch page and extract structured data records.

        Returns:
            List of normalized raw record dicts from structured data.
        """
        records: list[dict] = []
        headers = {"User-Agent": get_random_ua()}

        async with httpx.AsyncClient(
            headers=headers,
            timeout=30.0,
            follow_redirects=True,
        ) as client:
            response = await client.get(self.config.url)
            response.raise_for_status()
            self.bytes_downloaded += len(response.content)

            # Extract ALL structured data
            data = extruct.extract(
                response.text,
                base_url=str(response.url),
                syntaxes=["json-ld", "microdata", "opengraph"],
                uniform=True,
            )

            # Process JSON-LD items
            for item in data.get("json-ld", []):
                mapped = self._map_jsonld_item(item)
                if mapped:
                    if self.is_expired_beyond_cutoff(mapped.get("application_deadline")):
                        continue
                    record = self.process_record(mapped)
                    records.append(record)
                    self.records_found += 1

            # If detail_page=True, follow links found in structured data
            if self.config.detail_page:
                for record in records:
                    detail_url = record.get("application_url") or record.get("source_url")
                    if detail_url:
                        detail_data = await self._fetch_detail(client, detail_url)
                        record.update(detail_data)
                        await asyncio.sleep(self.config.rate_limit_delay)

        return records

    def _map_jsonld_item(self, item: dict) -> dict | None:
        """Map JSON-LD schema.org properties to raw_record fields.

        Handles Scholarship, EducationalOccupationalProgram, and Event types.
        Falls back to field_mappings from config if the type is not recognized.

        Args:
            item: A single JSON-LD item dict.

        Returns:
            Mapped record dict, or None if the item cannot be mapped.
        """
        item_type = self._get_type(item)

        # Try schema.org type-specific mappings
        field_map = _SCHEMA_TYPE_FIELD_MAPS.get(item_type, {})
        if field_map:
            return self._apply_map(item, field_map)

        # Fall back to config field_mappings
        if self.config.field_mappings:
            return self.apply_field_mappings(item)

        # Last resort: extract any recognizable fields
        result: dict[str, Any] = {}
        if "name" in item:
            result["title"] = item["name"]
        if "description" in item:
            result["description"] = item["description"]
        if "url" in item:
            result["source_url"] = item["url"]
        return result if result else None

    async def _fetch_detail(self, client: httpx.AsyncClient, url: str) -> dict:
        """Fetch a detail page and extract additional structured data.

        Args:
            client: Active httpx client.
            url: URL of the detail page.

        Returns:
            Dict of additional fields extracted from the detail page.
        """
        try:
            response = await client.get(url)
            response.raise_for_status()
            self.bytes_downloaded += len(response.content)

            data = extruct.extract(
                response.text,
                base_url=str(response.url),
                syntaxes=["json-ld"],
                uniform=True,
            )

            for item in data.get("json-ld", []):
                mapped = self._map_jsonld_item(item)
                if mapped:
                    return mapped
        except httpx.HTTPError:
            logger.warning("detail_fetch_failed", url=url)

        return {}

    @staticmethod
    def _get_type(item: dict) -> str:
        """Extract the schema.org type from a JSON-LD item.

        Args:
            item: JSON-LD item dict.

        Returns:
            Type name string (e.g. "Scholarship") or empty string.
        """
        item_type = item.get("@type", "")
        if isinstance(item_type, list):
            item_type = item_type[0] if item_type else ""
        # Strip schema.org prefix if present
        return str(item_type).replace("http://schema.org/", "").replace("https://schema.org/", "")

    @staticmethod
    def _apply_map(item: dict, field_map: dict[str, str]) -> dict:
        """Apply a field mapping to a JSON-LD item.

        Args:
            item: Source JSON-LD item.
            field_map: Mapping from source keys to target field names.

        Returns:
            Dict with mapped field names and their values.
        """
        result: dict[str, Any] = {}
        for source_key, target_key in field_map.items():
            value = item.get(source_key)
            if value is not None:
                # Handle nested objects (e.g. provider: {name: "..."})
                if isinstance(value, dict):
                    value = value.get("name", str(value))
                result[target_key] = value
        return result
