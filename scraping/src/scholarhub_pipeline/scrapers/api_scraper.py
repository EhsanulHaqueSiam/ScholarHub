"""API scraper for sources with public JSON/CSV endpoints.

Fetches paginated JSON data from API endpoints using httpx,
extracts items via a configurable JSON path, applies field
mappings, and produces normalized records. Also supports CSV
responses when selectors["format"] == "csv".
"""

from __future__ import annotations

import asyncio
import csv
import io
from typing import Any

import httpx
import structlog

from scholarhub_pipeline.scrapers.base import BaseScraper
from scholarhub_pipeline.utils.ua_rotation import get_random_ua

logger = structlog.get_logger()


class ApiScraper(BaseScraper):
    """Scraper for sources with public API endpoints.

    Consumes a SourceConfig whose ``selectors`` dict should include:
    - ``items_path``: dot-separated JSON path to the array of items
      (e.g. ``"data.scholarships"``).

    Pagination is driven by ``pagination`` config:
    - ``cursor_path``: dot-separated path to next page URL in the response
    - ``max_pages``: upper bound on pages to fetch (default 100)
    """

    async def scrape(self) -> list[dict]:
        """Fetch records from a JSON API with pagination support.

        Returns:
            List of normalized raw record dicts.
        """
        records: list[dict] = []
        headers = {"User-Agent": get_random_ua()}

        async with httpx.AsyncClient(headers=headers, timeout=30.0) as client:
            url: str | None = self.config.url
            page = 0

            is_csv = self.config.selectors.get("format") == "csv"

            while url:
                response = await client.get(url)
                response.raise_for_status()
                self.bytes_downloaded += len(response.content)

                if is_csv:
                    reader = csv.DictReader(io.StringIO(response.text))
                    items = list(reader)
                else:
                    data = response.json()
                    # Extract items using selectors["items_path"]
                    items = self._extract_items(data)

                if not items:
                    break

                host_country_default = self.config.selectors.get(
                    "host_country_default", ""
                )

                for idx, item in enumerate(items):
                    mapped = self.apply_field_mappings(item)
                    if host_country_default and not mapped.get("host_country"):
                        mapped["host_country"] = host_country_default
                    if self.is_expired_beyond_cutoff(mapped.get("application_deadline")):
                        return records
                    # Generate external_id from title+provider for dedup
                    if not mapped.get("external_id"):
                        title = mapped.get("title", "")
                        provider = mapped.get("provider_organization", "")
                        if title:
                            import hashlib
                            id_src = f"{title}|{provider}".encode()
                            mapped["external_id"] = hashlib.md5(id_src).hexdigest()[:16]  # noqa: S324
                    record = self.process_record(mapped)
                    record["source_url"] = record.get("source_url") or url
                    records.append(record)
                    self.records_found += 1

                # CSV endpoints return all data in a single request
                if is_csv:
                    break

                # Pagination
                url = self._get_next_url(data)
                page += 1
                max_pages = (
                    self.config.pagination.get("max_pages", 100)
                    if self.config.pagination
                    else 100
                )
                if page >= max_pages:
                    break

                await asyncio.sleep(self.config.rate_limit_delay)

        return records

    def _extract_items(self, data: dict | list) -> list:
        """Navigate JSON path from selectors to extract item list.

        Supports dot-separated paths like ``"data.scholarships"`` to
        traverse nested JSON structures.

        Args:
            data: Parsed JSON response (dict or list).

        Returns:
            List of item dicts, or empty list if path not found.
        """
        items_path = self.config.selectors.get("items_path", "")
        if not items_path:
            return data if isinstance(data, list) else []

        current: Any = data
        for key in items_path.split("."):
            if isinstance(current, dict) and key in current:
                current = current[key]
            else:
                return []

        return current if isinstance(current, list) else []

    def _get_next_url(self, data: dict) -> str | None:
        """Extract next page URL from API response.

        Uses ``pagination.cursor_path`` to navigate the response JSON
        and find the next page URL or cursor value.

        Args:
            data: Parsed JSON response dict.

        Returns:
            Next page URL string, or None if no more pages.
        """
        if not self.config.pagination:
            return None

        cursor_path = self.config.pagination.get("cursor_path", "")
        if not cursor_path:
            return None

        current: Any = data
        for key in cursor_path.split("."):
            if isinstance(current, dict) and key in current:
                current = current[key]
            else:
                return None

        return str(current) if current else None
