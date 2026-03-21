"""WeMakeScholars source configuration.

HTML scraping of paginated scholarship listings with 15K+ records.
Uses CSS selectors targeting the .bgwms2 listing containers.
"""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseAggregatorConfig


@dataclass
class Config(BaseAggregatorConfig):
    """WeMakeScholars aggregator config."""

    name: str = "WeMakeScholars"
    url: str = "https://www.wemakescholars.com/scholarship/index?page=1"
    source_id: str = "wemakescholars"
    primary_method: str = "scrape"
    secondary_method: str | None = None
    selectors: dict[str, str] = field(default_factory=lambda: {
        "listing": ".bgwms2",
        "title": "a::text",
        "detail_link": "a::attr(href)",
    })
    field_mappings: dict[str, str] = field(default_factory=lambda: {
        "title": "title",
        "detail_link": "source_url",
    })
    pagination: dict | None = field(default_factory=lambda: {
        "type": "page_num",
        "max_pages": 100,
    })
    detail_page: bool = False
    rate_limit_delay: float = 3.0


CONFIG = Config()
