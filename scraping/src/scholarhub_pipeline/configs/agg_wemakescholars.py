"""WeMakeScholars source configuration.

HTML scraping of paginated scholarship listings with 15K+ records.
Each card is a ``div.post`` containing an ``h2.post-title`` link and
structured metadata in ``.text-line-div`` label/value pairs.
"""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseAggregatorConfig


@dataclass
class Config(BaseAggregatorConfig):
    """WeMakeScholars aggregator config."""

    name: str = "WeMakeScholars"
    url: str = "https://www.wemakescholars.com/scholarship/index"
    source_id: str = "wemakescholars"
    primary_method: str = "scrape"
    secondary_method: str | None = None
    selectors: dict[str, str] = field(default_factory=lambda: {
        "listing": "div.post",
        "title": "h2.post-title a::text",
        "detail_link": "h2.post-title a::attr(href)",
    })
    field_mappings: dict[str, str] = field(default_factory=lambda: {
        "title": "title",
        "detail_link": "source_url",
    })
    pagination: dict | None = field(default_factory=lambda: {
        "type": "page_num",
        "param": "page",
        "start": 1,
        "max_pages": 100,
    })
    detail_page: bool = False
    rate_limit_delay: float = 3.0


CONFIG = Config()
