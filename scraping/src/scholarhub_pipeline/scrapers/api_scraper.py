"""API scraper for sources with public JSON/CSV/nextdata endpoints.

Fetches paginated JSON data from API endpoints using httpx,
extracts items via a configurable JSON path, applies field
mappings, and produces normalized records. Also supports CSV
responses when selectors["format"] == "csv" and Next.js
``__NEXT_DATA__`` extraction when selectors["format"] == "nextdata".

For nextdata sources with ``detail_page: True``, the scraper
fetches individual detail pages, extracts ``__NEXT_DATA__`` JSON,
and merges additional fields using ``detail_field_mappings``.
"""

from __future__ import annotations

import asyncio
import csv
import io
import json as json_mod
import re
from typing import Any
from urllib.parse import quote

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
    - ``format``: response format -- ``"json"`` (default), ``"csv"``, or
      ``"nextdata"`` (extract JSON from ``__NEXT_DATA__`` script tag).

    Pagination is driven by ``pagination`` config:
    - ``type``: ``"cursor"`` (default) or ``"page_num"``
    - ``cursor_path``: (cursor) dot-separated path to next page URL
    - ``param"``: (page_num) query parameter name (default ``"page"``)
    - ``start``: (page_num) first page number (default 1)
    - ``max_pages``: upper bound on pages to fetch (default 100)
    """

    async def scrape(self) -> list[dict]:
        """Fetch records from a JSON/CSV/nextdata API with pagination support.

        Returns:
            List of normalized raw record dicts.
        """
        records: list[dict] = []
        headers = {"User-Agent": get_random_ua()}

        async with httpx.AsyncClient(headers=headers, timeout=30.0) as client:
            url: str | None = self.config.url
            page = 0

            is_csv = self.config.selectors.get("format") == "csv"
            is_nextdata = self.config.selectors.get("format") == "nextdata"

            while url:
                response = await client.get(url)
                response.raise_for_status()
                self.bytes_downloaded += len(response.content)

                data: dict | list = {}

                if is_csv:
                    reader = csv.DictReader(io.StringIO(response.text))
                    items = list(reader)
                elif is_nextdata:
                    match = re.search(
                        r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>',
                        response.text,
                        re.DOTALL,
                    )
                    if not match:
                        logger.warning("no_nextdata_script", url=url)
                        break
                    data = json_mod.loads(match.group(1))
                    items = self._extract_items(data)
                else:
                    data = response.json()
                    # Extract items using selectors["items_path"]
                    items = self._extract_items(data)

                if not items:
                    break

                host_country_default = self.config.selectors.get(
                    "host_country_default", ""
                )

                # Detail page support for nextdata format
                detail_enabled = (
                    is_nextdata
                    and self.config.detail_page
                    and self.config.selectors.get("detail_url_template")
                )
                detail_mappings = self.config.selectors.get("detail_field_mappings", {})
                detail_items_path = self.config.selectors.get("detail_items_path", "")

                for idx, item in enumerate(items):
                    mapped = self.apply_field_mappings(item)
                    # Strip HTML tags from string values (e.g., EduCanada's <a> tags)
                    for k, v in mapped.items():
                        if isinstance(v, str) and "<" in v and ">" in v:
                            mapped[k] = re.sub(r"<[^>]+>", "", v).strip()
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

                    # Fetch detail page for extra fields
                    if detail_enabled and detail_mappings:
                        detail_data = await self._fetch_detail_nextdata(
                            client, item, detail_items_path, detail_mappings,
                        )
                        if detail_data:
                            # Merge detail fields without overwriting listing fields
                            for k, v in detail_data.items():
                                if v and not mapped.get(k):
                                    mapped[k] = v
                        await asyncio.sleep(self.config.rate_limit_delay)

                    record = self.process_record(mapped)
                    record["source_url"] = record.get("source_url") or url
                    records.append(record)
                    self.records_found += 1

                    # Respect max_records limit
                    if self.config.max_records and self.records_found >= self.config.max_records:
                        return records

                # CSV endpoints return all data in a single request
                if is_csv:
                    break

                # Pagination
                pag_type = self.config.pagination.get("type") if self.config.pagination else None

                if pag_type == "page_num":
                    page += 1
                    param = self.config.pagination.get("param", "page")
                    start = self.config.pagination.get("start", 1)
                    base = self.config.url.split("?")[0]
                    sep = "&" if "?" in self.config.url else "?"
                    url = f"{self.config.url}{sep}{param}={start + page}"
                else:
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

    def _build_detail_url(self, item: dict) -> str | None:
        """Build a detail page URL from a listing item using the URL template.

        The template uses ``{field}`` placeholders that are resolved from
        the item dict.  Dot-notation (e.g. ``{url_slug.institution_name}``)
        is supported via ``_get_nested``.  A special ``{slug:field}``
        syntax kebab-cases the value (lowercase, non-alnum → hyphens).

        Args:
            item: Raw listing item dict.

        Returns:
            Fully resolved URL string, or None if a required field is missing.
        """
        template = self.config.selectors.get("detail_url_template", "")
        if not template:
            return None

        missing = False

        def _replace(m: re.Match) -> str:
            nonlocal missing
            expr = m.group(1)
            slugify = False
            if expr.startswith("slug:"):
                slugify = True
                expr = expr[5:]
            val = self._get_nested(item, expr)
            if val is None:
                missing = True
                return ""
            val_str = str(val)
            if slugify:
                val_str = re.sub(r"[^a-z0-9]+", "-", val_str.lower()).strip("-")
            return quote(val_str, safe="-/")

        url = re.sub(r"\{([^}]+)\}", _replace, template)
        return url if url and not missing else None

    async def _fetch_detail_nextdata(
        self,
        client: httpx.AsyncClient,
        item: dict,
        detail_items_path: str,
        detail_mappings: dict[str, str],
    ) -> dict:
        """Fetch a detail page and extract fields from its ``__NEXT_DATA__``.

        Args:
            client: Active httpx client.
            item: Raw listing item dict (used to build the detail URL).
            detail_items_path: Dot-notation path to the detail object in
                ``__NEXT_DATA__`` JSON.
            detail_mappings: Source→target field mappings for detail fields.

        Returns:
            Dict of mapped detail fields, or empty dict on failure.
        """
        url = self._build_detail_url(item)
        if not url:
            return {}

        try:
            resp = await client.get(url, follow_redirects=True)
            resp.raise_for_status()
            self.bytes_downloaded += len(resp.content)

            match = re.search(
                r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>',
                resp.text,
                re.DOTALL,
            )
            if not match:
                logger.debug("detail_no_nextdata", url=url)
                return {}

            data = json_mod.loads(match.group(1))

            # Navigate to detail object
            detail_obj: Any = data
            if detail_items_path:
                for key in detail_items_path.split("."):
                    if isinstance(detail_obj, dict) and key in detail_obj:
                        detail_obj = detail_obj[key]
                    else:
                        logger.debug("detail_path_missing", url=url, key=key)
                        return {}

            if not isinstance(detail_obj, dict):
                return {}

            # Apply detail field mappings
            mapped: dict = {}
            for source_field, target_field in detail_mappings.items():
                if "." in source_field:
                    value = self._get_nested(detail_obj, source_field)
                else:
                    value = detail_obj.get(source_field)
                if value is not None:
                    # Convert dicts/lists to strings for storage
                    if isinstance(value, dict):
                        value = ", ".join(str(v) for v in value.values())
                    elif isinstance(value, list):
                        value = ", ".join(str(v) for v in value)
                    mapped[target_field] = value

            return mapped
        except Exception:  # noqa: BLE001
            logger.debug("detail_page_failed", url=url)
            return {}
