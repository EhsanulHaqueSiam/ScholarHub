"""Bold.org Scholarships source configuration.

Targets the Bold.org Next.js SSR site listing ~3231 scholarship records.
Uses URL-based pagination with page number in path.
"""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseAggregatorConfig


@dataclass
class Config(BaseAggregatorConfig):
    """Bold.org Scholarships aggregator config."""

    name: str = "Bold.org Scholarships"
    url: str = "https://bold.org/scholarships/"
    source_id: str = "bold_org_scholarships"
    primary_method: str = "scrape"
    secondary_method: str | None = None
    selectors: dict[str, str] = field(default_factory=lambda: {
        "listing": "a[href*='/scholarships/']",
        "title": "h3::text, h2::text",
        "detail_link": "::attr(href)",
        "host_country_default": "United States",
    })
    field_mappings: dict[str, str] = field(default_factory=lambda: {
        "title": "title",
        "detail_link": "source_url",
    })
    pagination: dict | None = field(default_factory=lambda: {
        "type": "url",
        "pattern": "https://bold.org/scholarships/{page}/",
        "max_pages": 50,
    })
    detail_page: bool = False
    rate_limit_delay: float = 3.0


CONFIG = Config()
