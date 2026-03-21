"""InternationalScholarships.com source configuration.

Yii framework site with a single-request grid table containing ~1565
scholarship records. No pagination needed as per-page=5000 returns all.
"""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseAggregatorConfig


@dataclass
class Config(BaseAggregatorConfig):
    """InternationalScholarships aggregator config."""

    name: str = "InternationalScholarships"
    url: str = "https://www.internationalscholarships.com/scholarships?per-page=5000"
    source_id: str = "internationalscholarships"
    primary_method: str = "scrape"
    secondary_method: str | None = None
    selectors: dict[str, str] = field(default_factory=lambda: {
        "listing": "#award-grid table tbody tr",
        "title": "td.award-search-grid-name a::text",
        "description": "td.award-search-grid-description::text",
        "detail_link": "td.award-search-grid-name a::attr(href)",
    })
    field_mappings: dict[str, str] = field(default_factory=lambda: {
        "title": "title",
        "description": "description",
        "detail_link": "source_url",
    })
    pagination: dict | None = None
    detail_page: bool = False
    rate_limit_delay: float = 3.0


CONFIG = Config()
