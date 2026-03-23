"""Ontario Graduate Scholarship (OGS) source configuration.

Targets the University of Toronto School of Graduate Studies OGS page.
Single-record WordPress page with structured award information.
URL: https://www.sgs.utoronto.ca/awards/ontario-graduate-scholarship/
"""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseOfficialConfig


@dataclass
class Config(BaseOfficialConfig):
    """Ontario Graduate Scholarship official program config."""

    name: str = "Ontario Graduate Scholarship"
    url: str = "https://www.sgs.utoronto.ca/awards/ontario-graduate-scholarship/"
    source_id: str = "ontario_graduate_scholarship"
    primary_method: str = "scrape"
    secondary_method: str | None = "scrapling"
    selectors: dict[str, str] = field(default_factory=lambda: {
        "listing": "article, .entry-content, .wp-block-group",
        "title": "h1::text",
        "description": ".entry-content p::text",
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
