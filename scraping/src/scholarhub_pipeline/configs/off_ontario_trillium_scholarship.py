"""Ontario Trillium Scholarship (OTS) source configuration.

Targets the University of Toronto School of Graduate Studies awards listing
page. Note: LOW confidence -- the original OTS-specific URL returned 404;
using the general SGS awards listing page as a fallback.
URL: https://www.sgs.utoronto.ca/awards/
"""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseOfficialConfig


@dataclass
class Config(BaseOfficialConfig):
    """Ontario Trillium Scholarship official program config."""

    name: str = "Ontario Trillium Scholarship"
    url: str = "https://www.sgs.utoronto.ca/awards/"
    source_id: str = "ontario_trillium_scholarship"
    primary_method: str = "scrape"
    secondary_method: str | None = "scrapling"
    selectors: dict[str, str] = field(default_factory=lambda: {
        "listing": "article, .entry-content",
        "title": "h1::text, h2::text",
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
