"""HTML scraper using Scrapling Fetcher for standard web pages.

Config-driven HTML scraping that uses CSS selectors from the
SourceConfig to extract scholarship data from listing pages.
Supports pagination and fuzzy selector fallback.
"""

from __future__ import annotations

import asyncio

import structlog
from scrapling import Fetcher

from scholarhub_pipeline.scrapers.base import BaseScraper
from scholarhub_pipeline.utils.fuzzy_fallback import find_listing_selector

logger = structlog.get_logger()


class HtmlScraper(BaseScraper):
    """Config-driven HTML scraper using Scrapling Fetcher.

    Uses the ``selectors`` dict from config to extract data:
    - ``listing``: CSS selector for repeating item containers
    - ``next_page``: CSS selector for the pagination link
    - Other keys: field-specific selectors applied within each item

    Falls back to fuzzy heuristic selector recovery when configured
    selectors return no matches.
    """

    _fetcher_configured = False

    @classmethod
    def _ensure_fetcher_configured(cls) -> None:
        if cls._fetcher_configured:
            return
        try:
            Fetcher.configure(auto_match=True)
        except Exception:  # pragma: no cover - depends on Scrapling version
            # Backward compatibility for older Scrapling versions.
            Fetcher.configure(adaptive=True)
        cls._fetcher_configured = True

    @staticmethod
    def _extract_from_node(node: object, selectors: dict[str, str]) -> dict:
        """Extract field values from a Scrapling node using configured selectors."""
        extracted: dict = {}
        non_css_keys = {
            "listing",
            "next_page",
            "feed_url",
            "items_key",
            "items_path",
            "cursor_path",
        }
        for field_name, selector in selectors.items():
            if field_name in non_css_keys or field_name.endswith("_default"):
                continue
            if not selector:
                continue
            result = node.css(selector)  # type: ignore[attr-defined]
            if result:
                value = result[0].text if result[0].text else result.get()
                if value:
                    extracted[field_name] = str(value).strip()
        return extracted

    @staticmethod
    def _extract_page_metadata(node: object) -> dict:
        """Extract generic metadata fallback from a page-level node."""
        metadata: dict[str, str] = {}
        field_selectors = {
            "title": (
                "meta[property='og:title']::attr(content), "
                "meta[name='twitter:title']::attr(content), "
                "title::text, h1::text"
            ),
            "description": (
                "meta[name='description']::attr(content), "
                "meta[property='og:description']::attr(content), "
                "article p::text, main p::text"
            ),
        }
        for field, selector in field_selectors.items():
            result = node.css(selector)  # type: ignore[attr-defined]
            if not result:
                continue
            value = result[0].text if result[0].text else result.get()
            if value:
                metadata[field] = str(value).strip()
        return metadata

    def _extract_single_page_record(self, response: object, page_url: str) -> dict | None:
        """Fallback when listing selectors miss but the page itself has one opportunity."""
        extracted = self._extract_from_node(response, self.config.selectors)
        if not extracted:
            extracted = self._extract_page_metadata(response)
        if extracted and not extracted.get("title"):
            extracted["title"] = self.config.name
        if not extracted:
            return None

        mapped = self.apply_field_mappings(extracted) if self.config.field_mappings else extracted
        if not mapped.get("title"):
            mapped["title"] = extracted.get("title") or self.config.name

        for key, val in self.config.selectors.items():
            if key.endswith("_default") and val:
                target = key.removesuffix("_default")
                if not mapped.get(target):
                    mapped[target] = val

        if self.config.detail_selectors:
            detail_raw = self._extract_from_node(response, self.config.detail_selectors)
            detail_mapped = (
                self.apply_field_mappings(detail_raw)
                if self.config.field_mappings
                else detail_raw
            )
            mapped.update(detail_mapped)

        mapped["source_url"] = mapped.get("source_url") or page_url
        if not mapped.get("title"):
            return None
        return self.process_record(mapped)

    async def scrape(self) -> list[dict]:
        """Scrape HTML pages and return normalized records.

        Returns:
            List of normalized raw record dicts.
        """
        self._ensure_fetcher_configured()

        records: list[dict] = []
        seen_keys: set[str] = set()
        seen_detail_urls: set[str] = set()
        seen_page_urls: set[str] = set()
        detail_cache: dict[str, dict] = {}
        url: str | None = self.config.url
        page = 0
        incremental_mode = bool(getattr(self.config, "incremental_mode", False))
        effective_detail_page = self.config.detail_page and not (
            incremental_mode and getattr(self.config, "incremental_skip_detail", True)
        )

        while url:
            current_url = str(url).strip()
            current_url_norm = current_url.lower()
            if current_url_norm in seen_page_urls:
                logger.warning("pagination_loop_detected", source=self.config.name, url=current_url)
                break
            seen_page_urls.add(current_url_norm)

            response = await asyncio.to_thread(Fetcher.get, url)
            body = response.body if hasattr(response, "body") else b""
            self.bytes_downloaded += len(body) if isinstance(body, bytes) else len(str(body))

            # Try configured selectors first
            listing_selector = self.config.selectors.get("listing", "")
            items = response.css(listing_selector) if listing_selector else []

            # Fuzzy fallback if selectors return nothing
            if not items and listing_selector:
                logger.warning(
                    "selector_miss",
                    source=self.config.name,
                    selector=listing_selector,
                )
                body_str = body.decode("utf-8", errors="replace") if isinstance(body, bytes) else str(body)
                fallback_selector = find_listing_selector(body_str)
                if fallback_selector:
                    items = response.css(fallback_selector)
                    logger.info(
                        "fuzzy_fallback_success",
                        source=self.config.name,
                        selector=fallback_selector,
                    )

            if not items:
                single_record = self._extract_single_page_record(response, current_url)
                if single_record:
                    logger.info("single_page_fallback_success", source=self.config.name, url=current_url)
                    records.append(single_record)
                    self.records_found += 1
                    return records
                break

            for item in items:
                extracted = self._extract_from_node(item, self.config.selectors)

                mapped = (
                    self.apply_field_mappings(extracted)
                    if self.config.field_mappings
                    else extracted
                )

                # Apply default values from selectors (e.g. host_country_default)
                for key, val in self.config.selectors.items():
                    if key.endswith("_default") and val:
                        target = key.removesuffix("_default")
                        if not mapped.get(target):
                            mapped[target] = val

                if self.is_expired_beyond_cutoff(mapped.get("application_deadline")):
                    return records

                detail_url_full: str | None = None
                if effective_detail_page:
                    detail_link_selector = self.config.selectors.get(
                        "detail_link",
                        "a::attr(href)",
                    )
                    detail_result = item.css(detail_link_selector)
                    if detail_result:
                        detail_url = detail_result.get()
                        if detail_url:
                            detail_url_full = (
                                response.urljoin(detail_url)
                                if hasattr(response, "urljoin")
                                else detail_url
                            )
                            mapped["source_url"] = mapped.get("source_url", detail_url_full)
                            normalized_detail_url = str(detail_url_full).strip().lower()
                            if normalized_detail_url in seen_detail_urls:
                                continue
                            seen_detail_urls.add(normalized_detail_url)

                dedup_key = (
                    str(mapped.get("source_url") or "").strip().lower()
                    or str(mapped.get("title") or "").strip().lower()
                )
                if dedup_key:
                    if dedup_key in seen_keys:
                        continue
                    seen_keys.add(dedup_key)

                # Follow detail page if configured
                if effective_detail_page and detail_url_full:
                    if detail_url_full in detail_cache:
                        detail_data = detail_cache[detail_url_full]
                    else:
                        detail_data = await self._scrape_detail(detail_url_full)
                        detail_cache[detail_url_full] = detail_data
                    mapped.update(detail_data)

                mapped["source_url"] = mapped.get("source_url", url)
                record = self.process_record(mapped)
                records.append(record)
                self.records_found += 1
                if self.config.max_records and self.records_found >= self.config.max_records:
                    return records

            # Pagination
            page += 1
            max_pages = (
                self.config.pagination.get("max_pages", 100)
                if self.config.pagination
                else 100
            )
            if incremental_mode:
                incremental_limit = max(1, int(getattr(self.config, "incremental_max_pages", 3)))
                max_pages = min(max_pages, incremental_limit)
            if page >= max_pages:
                break

            pag_type = self.config.pagination.get("type") if self.config.pagination else None

            if pag_type == "page_num":
                # Numeric pagination: append ?page=N (or configured param)
                param = self.config.pagination.get("param", "page")
                start = self.config.pagination.get("start", 1)
                base = self.config.url.split("?")[0]
                sep = "&" if "?" in self.config.url else "?"
                url = f"{self.config.url}{sep}{param}={start + page}"
            else:
                # CSS selector pagination: follow "next" link
                next_selector = self.config.selectors.get("next_page") or (
                    self.config.pagination.get("selector") if self.config.pagination else None
                )
                if next_selector:
                    next_result = response.css(next_selector)
                    next_link = next_result.get() if next_result else None
                    if next_link and hasattr(response, "urljoin"):
                        next_url = str(response.urljoin(next_link)).strip()
                        next_url_norm = next_url.lower()
                        if next_url_norm == current_url_norm or next_url_norm in seen_page_urls:
                            logger.warning(
                                "pagination_repeat_url",
                                source=self.config.name,
                                url=next_url,
                            )
                            url = None
                        else:
                            url = next_url
                    else:
                        url = None
                else:
                    url = None

            await asyncio.sleep(self.config.rate_limit_delay)

        return records

    async def _scrape_detail(self, url: str) -> dict:
        """Fetch and extract fields from a detail page.

        Args:
            url: URL of the detail page.

        Returns:
            Dict of extracted fields from the detail page.
        """
        try:
            response = await asyncio.to_thread(Fetcher.get, url)
            extracted: dict = {}
            if self.config.detail_selectors:
                for field_name, selector in self.config.detail_selectors.items():
                    result = response.css(selector)
                    if result:
                        value = result[0].text if result[0].text else result.get()
                        if value:
                            extracted[field_name] = str(value).strip()
            return (
                self.apply_field_mappings(extracted)
                if self.config.field_mappings
                else extracted
            )
        except Exception:  # noqa: BLE001
            logger.warning("detail_page_failed", url=url)
            return {}
