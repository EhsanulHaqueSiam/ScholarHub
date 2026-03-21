"""ICCR India Scholarships source configuration.

Targets the ICCR A2A scholarships portal listing ~20 schemes.
Uses definition list (dl dt) scraping, single page.
"""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseGovernmentConfig


@dataclass
class Config(BaseGovernmentConfig):
    """ICCR India Scholarships government config."""

    name: str = "ICCR India Scholarships"
    url: str = "https://a2ascholarships.iccr.gov.in/home/getAllSchemeList"
    source_id: str = "iccr_india_scholarships"
    primary_method: str = "scrape"
    secondary_method: str | None = None
    selectors: dict[str, str] = field(default_factory=lambda: {
        "listing": "dl dt",
        "title": "a::text",
        "host_country_default": "India",
    })
    field_mappings: dict[str, str] = field(default_factory=lambda: {
        "title": "title",
    })
    pagination: dict | None = None
    detail_page: bool = False
    rate_limit_delay: float = 3.0


CONFIG = Config()
