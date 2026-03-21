"""Swedish Institute Scholarships source configuration.

Targets the Swedish Institute WordPress site listing ~2 scholarship
programmes. Single page, no pagination needed.
"""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseGovernmentConfig


@dataclass
class Config(BaseGovernmentConfig):
    """Swedish Institute Scholarships government config."""

    name: str = "Swedish Institute Scholarships"
    url: str = "https://si.se/en/apply/scholarships/"
    source_id: str = "swedish_institute_scholarships"
    primary_method: str = "scrape"
    secondary_method: str | None = None
    selectors: dict[str, str] = field(default_factory=lambda: {
        "listing": "a[href*='/apply/scholarships/']",
        "title": "::text",
        "detail_link": "::attr(href)",
        "host_country_default": "Sweden",
    })
    field_mappings: dict[str, str] = field(default_factory=lambda: {
        "title": "title",
        "detail_link": "source_url",
    })
    pagination: dict | None = None
    detail_page: bool = False
    rate_limit_delay: float = 3.0


CONFIG = Config()
