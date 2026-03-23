"""Stealthy scraper for Cloudflare-protected sites.

Uses Scrapling's StealthyFetcher which handles Cloudflare bypass,
browser fingerprint evasion, and JavaScript rendering automatically.
"""

from __future__ import annotations

import asyncio

import structlog
from scrapling import StealthyFetcher

from scholarhub_pipeline.scrapers.base import BaseScraper

logger = structlog.get_logger()


class StealthyScraper(BaseScraper):
    """Scraper for Cloudflare-protected sites using StealthyFetcher.

    Same extraction logic as HtmlScraper but uses StealthyFetcher
    instead of Fetcher to handle anti-bot protections. Does not
    attempt fuzzy fallback since stealth pages tend to have
    predictable structures behind the protection.
    """

    @staticmethod
    def _fetch_sync(url: str) -> object:
        """Run StealthyFetcher.fetch in a thread (sync Playwright can't run in asyncio loop)."""
        return StealthyFetcher.fetch(url, headless=True, network_idle=True)

    async def scrape(self) -> list[dict]:
        """Scrape protected pages and return normalized records.

        Returns:
            List of normalized raw record dicts.
        """
        records: list[dict] = []
        seen_keys: set[str] = set()
        detail_cache: dict[str, dict] = {}
        url: str | None = self.config.url
        page = 0

        while url:
            # Run sync Playwright in thread to avoid asyncio conflict
            response = await asyncio.to_thread(self._fetch_sync, url)
            body = response.body if hasattr(response, "body") else b""
            self.bytes_downloaded += len(body) if isinstance(body, bytes) else len(str(body))

            listing_selector = self.config.selectors.get("listing", "")
            items = response.css(listing_selector) if listing_selector else []

            if not items:
                logger.warning("no_items_found", source=self.config.name, url=url)
                break

            for item in items:
                extracted: dict = {}
                for field_name, selector in self.config.selectors.items():
                    if field_name in ("listing", "next_page") or field_name.endswith("_default"):
                        continue
                    if not selector:
                        continue
                    result = item.css(selector)
                    if result:
                        value = result[0].text if result[0].text else result.get()
                        if value:
                            extracted[field_name] = str(value).strip()

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
                if self.config.detail_page:
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

                dedup_key = (
                    str(mapped.get("source_url") or "").strip().lower()
                    or str(mapped.get("title") or "").strip().lower()
                )
                if dedup_key:
                    if dedup_key in seen_keys:
                        continue
                    seen_keys.add(dedup_key)

                if self.config.detail_page and detail_url_full:
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
                self.config.pagination.get("max_pages", 50)
                if self.config.pagination
                else 50
            )
            if page >= max_pages:
                break

            pag_type = self.config.pagination.get("type") if self.config.pagination else None

            if pag_type == "page_num":
                param = self.config.pagination.get("param", "page")
                start = self.config.pagination.get("start", 1)
                base = self.config.url.split("?")[0]
                sep = "&" if "?" in self.config.url else "?"
                url = f"{self.config.url}{sep}{param}={start + page}"
            else:
                next_selector = self.config.selectors.get("next_page") or (
                    self.config.pagination.get("selector") if self.config.pagination else None
                )
                if next_selector:
                    next_result = response.css(next_selector)
                    next_link = next_result.get() if next_result else None
                    url = (
                        response.urljoin(next_link)
                        if next_link and hasattr(response, "urljoin")
                        else None
                    )
                else:
                    url = None

            await asyncio.sleep(self.config.rate_limit_delay)

        return records

    async def _scrape_detail(self, url: str) -> dict:
        """Fetch detail page via StealthyFetcher.

        Args:
            url: URL of the detail page.

        Returns:
            Dict of extracted fields from the detail page.
        """
        try:
            response = await asyncio.to_thread(self._fetch_sync, url)
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
            logger.warning("stealthy_detail_failed", url=url)
            return {}
