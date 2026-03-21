"""Erasmus Mundus Joint Masters source configuration.

Targets the EACEA Drupal site listing ~211 Erasmus Mundus joint master
programmes. Uses HTML scraping with page_num pagination.
"""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseGovernmentConfig


@dataclass
class Config(BaseGovernmentConfig):
    """Erasmus Mundus Joint Masters government config."""

    name: str = "Erasmus Mundus Joint Masters"
    url: str = "https://www.eacea.ec.europa.eu/scholarships/erasmus-mundus-catalogue_en"
    source_id: str = "erasmus_mundus_catalogue"
    primary_method: str = "scrape"
    secondary_method: str | None = None
    selectors: dict[str, str] = field(default_factory=lambda: {
        "listing": "a[href*='master']",
        "title": "::text",
        "detail_link": "::attr(href)",
        "host_country_default": "Europe",
    })
    field_mappings: dict[str, str] = field(default_factory=lambda: {
        "title": "title",
        "detail_link": "source_url",
    })
    pagination: dict | None = field(default_factory=lambda: {
        "type": "page_num",
        "param": "page",
        "start": 0,
        "max_pages": 12,
    })
    detail_page: bool = False
    rate_limit_delay: float = 3.0


CONFIG = Config()
