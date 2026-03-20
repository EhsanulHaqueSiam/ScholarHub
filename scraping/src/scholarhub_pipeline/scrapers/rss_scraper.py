"""RSS/Atom feed scraper for scholarship sources.

Parses RSS and Atom feeds using feedparser, extracts basic fields
from each entry, and optionally follows entry links to detail pages
for additional data.
"""

from __future__ import annotations

import asyncio

import feedparser
import httpx
import structlog

from scholarhub_pipeline.scrapers.base import BaseScraper
from scholarhub_pipeline.utils.ua_rotation import get_random_ua

logger = structlog.get_logger()


class RssScraper(BaseScraper):
    """Parse RSS/Atom feeds with optional detail page following.

    Extracts title, description, source_url, and published date from
    each feed entry. If ``detail_page=True`` in config, follows each
    entry link and extracts additional fields using ``detail_selectors``.
    """

    async def scrape(self) -> list[dict]:
        """Parse the RSS feed and return normalized records.

        Returns:
            List of normalized raw record dicts.
        """
        records: list[dict] = []
        feed = feedparser.parse(self.config.url)

        for entry in feed.entries:
            basic: dict = {
                "title": entry.get("title", ""),
                "description": entry.get("summary", ""),
                "source_url": entry.get("link", ""),
                "application_deadline": entry.get("published", ""),
            }

            if self.is_expired_beyond_cutoff(basic.get("application_deadline")):
                continue

            mapped = self.apply_field_mappings(basic) if self.config.field_mappings else basic

            # Follow link for full data if detail_page=True
            if self.config.detail_page and basic.get("source_url"):
                detail = await self._fetch_detail_page(basic["source_url"])
                mapped.update(detail)

            record = self.process_record(mapped)
            records.append(record)
            self.records_found += 1

        return records

    async def _fetch_detail_page(self, url: str) -> dict:
        """Fetch individual entry page and extract fields using detail_selectors.

        Uses httpx to fetch the page and parses it with lxml to apply
        CSS selectors from the config's ``detail_selectors``.

        Args:
            url: URL of the detail page to fetch.

        Returns:
            Dict of extracted fields from the detail page.
        """
        extracted: dict = {}
        headers = {"User-Agent": get_random_ua()}

        try:
            async with httpx.AsyncClient(headers=headers, timeout=30.0) as client:
                response = await client.get(url)
                response.raise_for_status()
                self.bytes_downloaded += len(response.content)

                if self.config.detail_selectors:
                    from lxml import html as lxml_html

                    doc = lxml_html.fromstring(response.text)
                    for field_name, selector in self.config.detail_selectors.items():
                        try:
                            from lxml.cssselect import CSSSelector

                            sel = CSSSelector(selector)
                            matches = sel(doc)
                            if matches:
                                text = matches[0].text_content().strip()
                                if text:
                                    extracted[field_name] = text
                        except Exception:  # noqa: BLE001
                            logger.debug(
                                "detail_selector_failed",
                                field=field_name,
                                selector=selector,
                                url=url,
                            )

                await asyncio.sleep(self.config.rate_limit_delay)
        except httpx.HTTPError:
            logger.warning("detail_page_fetch_failed", url=url)

        return self.apply_field_mappings(extracted) if self.config.field_mappings else extracted
