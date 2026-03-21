"""Commonwealth Scholarships UK source configuration.

Targets the CSC UK WordPress site listing ~10 scholarship programmes.
Single page, no pagination needed.
"""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseGovernmentConfig


@dataclass
class Config(BaseGovernmentConfig):
    """Commonwealth Scholarships UK government config."""

    name: str = "Commonwealth Scholarships UK"
    url: str = "https://cscuk.fcdo.gov.uk/scholarships/"
    source_id: str = "commonwealth_scholarships_uk"
    primary_method: str = "scrape"
    secondary_method: str | None = None
    selectors: dict[str, str] = field(default_factory=lambda: {
        "listing": "article",
        "title": "h2 a::text, .entry-title a::text",
        "detail_link": "h2 a::attr(href), .entry-title a::attr(href)",
        "host_country_default": "United Kingdom",
    })
    field_mappings: dict[str, str] = field(default_factory=lambda: {
        "title": "title",
        "detail_link": "source_url",
    })
    pagination: dict | None = None
    detail_page: bool = False
    rate_limit_delay: float = 3.0


CONFIG = Config()
