"""John Allwright Fellowship (ACIAR) source configuration.

Targets the ACIAR John Allwright Fellowship page for Australian
government-funded research scholarships for developing country scientists.
URL: https://www.aciar.gov.au/scholarships/john-allwright-fellowship
"""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseGovernmentConfig


@dataclass
class Config(BaseGovernmentConfig):
    """John Allwright Fellowship (ACIAR) government config."""

    name: str = "John Allwright Fellowship (ACIAR)"
    url: str = "https://www.aciar.gov.au/scholarships/john-allwright-fellowship"
    source_id: str = "australia_john_allwright_fellowship"
    primary_method: str = "scrape"
    secondary_method: str | None = "scrapling"
    selectors: dict[str, str] = field(default_factory=lambda: {
        "listing": "article.node--type-standard-page",
        "title": "h1::text",
        "description": ".field--name-body .field__item p::text",
        "host_country_default": "Australia",
    })
    field_mappings: dict[str, str] = field(default_factory=lambda: {
        "title": "title",
        "description": "description",
    })
    pagination: dict | None = None
    detail_page: bool = False
    detail_selectors: dict[str, str] | None = None


CONFIG = Config()
