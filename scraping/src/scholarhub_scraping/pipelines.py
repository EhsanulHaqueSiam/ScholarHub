"""Scrapy pipelines for processing scraped scholarship data."""

from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    import scrapy

    from scholarhub_scraping.items import ScholarshipItem


class ScholarHubScrapingPipeline:
    """Default pipeline for processing scholarship items."""

    def process_item(
        self,
        item: ScholarshipItem,
        spider: scrapy.Spider,
    ) -> ScholarshipItem:
        """Process a scraped scholarship item.

        Args:
            item: The scraped scholarship item.
            spider: The spider that produced the item.

        Returns:
            The processed item.
        """
        return item
