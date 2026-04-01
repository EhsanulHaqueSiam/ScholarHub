"""FullyScholarships source configuration.

WordPress REST API endpoint returning scholarship posts as JSON.
Category 133 (fully-funded-scholarships) has ~505 posts.
Also pulls from sub-categories: bachelor (4001), master (4002), phd (4003).
"""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseAggregatorConfig


@dataclass
class Config(BaseAggregatorConfig):
    """FullyScholarships aggregator config (WordPress REST API)."""

    name: str = "FullyScholarships"
    url: str = "https://www.fullyscholarships.com/wp-json/wp/v2/posts?per_page=100&categories=133"
    source_id: str = "fully_scholarships"
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
        "max_pages": 6,
    })
    detail_page: bool = False
    rate_limit_delay: float = 2.0


CONFIG = Config()
