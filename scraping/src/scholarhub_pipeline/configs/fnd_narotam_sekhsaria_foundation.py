"""Narotam Sekhsaria Foundation source configuration.

Targets the Narotam Sekhsaria Foundation PG Scholarship programme page.
Funds Indian students for postgraduate study abroad (288+ scholars across
64 universities in 7 countries). Note: NOT nsf.org.in (different org).
URL: https://pg.nsfoundation.co.in/
"""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseFoundationConfig


@dataclass
class Config(BaseFoundationConfig):
    """Narotam Sekhsaria Foundation config."""

    name: str = "Narotam Sekhsaria Foundation"
    url: str = "https://pg.nsfoundation.co.in/"
    source_id: str = "narotam_sekhsaria_foundation"
    primary_method: str = "scrape"
    secondary_method: str | None = "scrapling"
    selectors: dict[str, str] = field(default_factory=lambda: {
        "listing": "article, .elementor-section, .e-con",
        "title": "h1::text, h2::text",
        "description": ".elementor-widget-text-editor p::text",
        "host_country_default": "India",
    })
    field_mappings: dict[str, str] = field(default_factory=lambda: {
        "title": "title",
        "description": "description",
    })
    pagination: dict | None = None
    detail_page: bool = False
    detail_selectors: dict[str, str] | None = None


CONFIG = Config()
