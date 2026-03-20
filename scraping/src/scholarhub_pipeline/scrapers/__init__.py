"""Scraper implementations for ScholarHub pipeline.

Provides a factory function ``get_scraper`` that maps a SourceConfig's
``primary_method`` to the appropriate scraper class.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

from scholarhub_pipeline.scrapers.api_scraper import ApiScraper
from scholarhub_pipeline.scrapers.base import BaseScraper
from scholarhub_pipeline.scrapers.html_scraper import HtmlScraper
from scholarhub_pipeline.scrapers.jsonld_extractor import JsonLdExtractor
from scholarhub_pipeline.scrapers.rss_scraper import RssScraper
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
}


def get_scraper(config: SourceConfig) -> BaseScraper:
    """Return appropriate scraper instance for a config's primary_method.

    Args:
        config: SourceConfig with ``primary_method`` set.

    Returns:
        Instantiated scraper ready to call ``.scrape()``.

    Raises:
        ValueError: If the primary_method is not recognized.
    """
    scraper_cls = SCRAPER_MAP.get(config.primary_method)
    if not scraper_cls:
        msg = f"Unknown scrape method: {config.primary_method}"
        raise ValueError(msg)
    return scraper_cls(config)


__all__ = [
    "ApiScraper",
    "BaseScraper",
    "HtmlScraper",
    "JsonLdExtractor",
    "RssScraper",
    "SCRAPER_MAP",
    "StealthyScraper",
    "get_scraper",
]
