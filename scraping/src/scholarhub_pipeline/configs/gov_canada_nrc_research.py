"""National Research Council Canada source configuration.

Targets the NRC Canada careers page for research fellowship and
scholarship opportunities. Note: LOW confidence -- site returns 403
on direct access; scrapling required for browser-like TLS fingerprint.
URL: https://nrc.canada.ca/en/corporate/careers/
"""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseGovernmentConfig


@dataclass
class Config(BaseGovernmentConfig):
    """National Research Council Canada government config."""

    name: str = "National Research Council Canada"
    url: str = "https://nrc.canada.ca/en/corporate/careers/"
    source_id: str = "canada_nrc_research"
    primary_method: str = "scrapling"
    secondary_method: str | None = None
    selectors: dict[str, str] = field(default_factory=lambda: {
        "listing": "main, article, .content",
        "title": "h1::text, h2::text",
        "description": "main p::text, article p::text",
        "host_country_default": "Canada",
    })
    field_mappings: dict[str, str] = field(default_factory=lambda: {
        "title": "title",
        "description": "description",
    })
    pagination: dict | None = None
    detail_page: bool = False
    detail_selectors: dict[str, str] | None = None
    rate_limit_delay: float = 5.0


CONFIG = Config()
