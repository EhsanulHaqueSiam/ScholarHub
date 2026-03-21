"""Scholars4Dev source configuration.

WordPress REST API endpoint returning scholarship posts as JSON.
Uses ApiScraper with page_num pagination across ~15 pages.
"""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseAggregatorConfig


@dataclass
class Config(BaseAggregatorConfig):
    """Scholars4Dev aggregator config (WordPress REST API)."""

    name: str = "Scholars4Dev"
    url: str = "https://scholars4dev.com/wp-json/wp/v2/posts?per_page=100&categories=62"
    source_id: str = "scholars4dev"
    primary_method: str = "api"
    secondary_method: str | None = None
    selectors: dict[str, str] = field(default_factory=lambda: {
        "format": "json",
        "items_path": "",
    })
    field_mappings: dict[str, str] = field(default_factory=lambda: {
        "title.rendered": "title",
        "link": "source_url",
        "excerpt.rendered": "description",
        "date": "application_deadline",
    })
    pagination: dict | None = field(default_factory=lambda: {
        "type": "page_num",
        "max_pages": 15,
    })
    detail_page: bool = False
    rate_limit_delay: float = 2.0


CONFIG = Config()
