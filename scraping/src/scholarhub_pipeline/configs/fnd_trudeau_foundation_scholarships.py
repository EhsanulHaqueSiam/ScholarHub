"""Trudeau Foundation Scholarships source configuration.

Targets the Pierre Elliott Trudeau Foundation programs page for doctoral
scholarships in social sciences and humanities. Up to $50,000/year for
3 years plus additional allowances.
URL: https://fondationtrudeau.ca/en/programs/
"""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseFoundationConfig


@dataclass
class Config(BaseFoundationConfig):
    """Trudeau Foundation Scholarships foundation config."""

    name: str = "Trudeau Foundation Scholarships"
    url: str = "https://fondationtrudeau.ca/en/programs/"
    source_id: str = "trudeau_foundation_scholarships"
    primary_method: str = "scrape"
    secondary_method: str | None = "scrapling"
    selectors: dict[str, str] = field(default_factory=lambda: {
        "listing": ".content, article",
        "title": "h1::text, h2::text",
        "description": ".content p::text",
        "host_country_default": "Canada",
    })
    field_mappings: dict[str, str] = field(default_factory=lambda: {
        "title": "title",
        "description": "description",
    })
    pagination: dict | None = None
    detail_page: bool = False
    detail_selectors: dict[str, str] | None = None


CONFIG = Config()
