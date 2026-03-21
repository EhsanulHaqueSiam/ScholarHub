"""ScholarshipRoar source configuration.

WordPress REST API endpoint returning scholarship posts as JSON.
Uses ApiScraper with page_num pagination across ~5 pages.
"""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseAggregatorConfig


@dataclass
class Config(BaseAggregatorConfig):
    """ScholarshipRoar aggregator config (WordPress REST API)."""

    name: str = "ScholarshipRoar"
    url: str = "https://scholarshiproar.com/wp-json/wp/v2/posts?per_page=100&categories=1255"
    source_id: str = "scholarship_roar"
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
    })
    pagination: dict | None = field(default_factory=lambda: {
        "type": "page_num",
        "max_pages": 5,
    })
    detail_page: bool = False
    rate_limit_delay: float = 2.0


CONFIG = Config()
