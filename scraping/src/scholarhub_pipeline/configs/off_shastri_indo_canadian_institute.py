"""Shastri Indo-Canadian Institute source configuration.

Targets the Shastri Institute grants and awards hub page. Multi-record
Drupal site with Quicktabs requiring JS for content display. Programs
include SHARP, SSTSG, and Faculty/Student Mobility grants.
URL: https://www.shastriinstitute.org/grants-awards
"""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseOfficialConfig


@dataclass
class Config(BaseOfficialConfig):
    """Shastri Indo-Canadian Institute official program config."""

    name: str = "Shastri Indo-Canadian Institute"
    url: str = "https://www.shastriinstitute.org/grants-awards"
    source_id: str = "shastri_indo_canadian_institute"
    primary_method: str = "scrapling"
    secondary_method: str | None = None
    selectors: dict[str, str] = field(default_factory=lambda: {
        "listing": ".views-row, .node, article",
        "title": "h2 a::text, h3::text",
        "detail_link": "h2 a::attr(href), a::attr(href)",
        "description": "p::text, .summary::text",
        "host_country_default": "Canada",
    })
    field_mappings: dict[str, str] = field(default_factory=lambda: {
        "title": "title",
        "detail_link": "source_url",
        "description": "description",
    })
    pagination: dict | None = None
    detail_page: bool = True
    detail_selectors: dict[str, str] | None = field(default_factory=lambda: {
        "description": ".field-body p::text, .content p::text",
        "eligibility": ".eligibility p::text, ul li::text",
    })


CONFIG = Config()
