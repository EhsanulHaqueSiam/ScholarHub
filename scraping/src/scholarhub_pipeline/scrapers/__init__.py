"""Scraper implementations for ScholarHub pipeline.

Provides a factory function ``get_scraper`` that maps a configured scrape
method to the appropriate scraper class.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

from scholarhub_pipeline.scrapers.api_scraper import ApiScraper
from scholarhub_pipeline.scrapers.base import BaseScraper
from scholarhub_pipeline.scrapers.html_scraper import HtmlScraper
from scholarhub_pipeline.scrapers.jsonld_extractor import JsonLdExtractor
from scholarhub_pipeline.scrapers.rss_scraper import RssScraper
from scholarhub_pipeline.scrapers.inertia_scraper import InertiaScraper
from scholarhub_pipeline.scrapers.stealthy_scraper import StealthyScraper

if TYPE_CHECKING:
    from scholarhub_pipeline.configs._protocol import SourceConfig

SCRAPER_MAP: dict[str, type[BaseScraper]] = {
    "api": ApiScraper,
    "jsonld": JsonLdExtractor,
    "ajax": ApiScraper,  # AJAX endpoints are JSON APIs
    "rss": RssScraper,
    "scrape": HtmlScraper,
    "scrapling": StealthyScraper,
    "inertia": InertiaScraper,
}


def get_scraper(config: SourceConfig, method: str | None = None) -> BaseScraper:
    """Return appropriate scraper instance for a configured method.

    Args:
        config: SourceConfig with scraping metadata.
        method: Optional explicit method override. Defaults to
            ``config.primary_method``.

    Returns:
        Instantiated scraper ready to call ``.scrape()``.

    Raises:
        ValueError: If the selected method is not recognized.
    """
    selected_method = method or config.primary_method
    scraper_cls = SCRAPER_MAP.get(selected_method)
    if not scraper_cls:
        msg = f"Unknown scrape method: {selected_method}"
        raise ValueError(msg)
    return scraper_cls(config)


__all__ = [
    "ApiScraper",
    "BaseScraper",
    "HtmlScraper",
    "InertiaScraper",
    "JsonLdExtractor",
    "RssScraper",
    "SCRAPER_MAP",
    "StealthyScraper",
    "get_scraper",
]
