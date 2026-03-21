"""IEFA Scholarships source configuration.

Yii framework site with the same structure as InternationalScholarships.
Single-request grid table. No pagination needed as per-page=5000 returns all.
"""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseAggregatorConfig


@dataclass
class Config(BaseAggregatorConfig):
    """IEFA Scholarships aggregator config."""

    name: str = "IEFA Scholarships"
    url: str = "https://www.iefa.org/scholarships?per-page=5000"
    source_id: str = "iefa_scholarships"
    primary_method: str = "scrape"
    secondary_method: str | None = None
    selectors: dict[str, str] = field(default_factory=lambda: {
        "listing": "#award-grid table tbody tr",
        "title": "td:first-child a::text",
        "description": "td:nth-child(2)::text",
        "detail_link": "td:first-child a::attr(href)",
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
