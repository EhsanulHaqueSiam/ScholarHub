"""Canadian Commonwealth Scholarship Plan source configuration.

Targets the EduCanada international scholarships hub page. Note: LOW
confidence URL -- no dedicated CCSP page exists; using the EduCanada
scholarships hub which references Commonwealth Scholarship Plan programs.
URL: https://www.educanada.ca/scholarships-bourses/index.aspx?lang=eng
"""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseGovernmentConfig


@dataclass
class Config(BaseGovernmentConfig):
    """Canadian Commonwealth Scholarship Plan government config."""

    name: str = "Canadian Commonwealth Scholarship Plan"
    url: str = "https://www.educanada.ca/scholarships-bourses/index.aspx?lang=eng"
    source_id: str = "canada_commonwealth_scholarship_plan"
    primary_method: str = "scrape"
    secondary_method: str | None = "scrapling"
    selectors: dict[str, str] = field(default_factory=lambda: {
        "listing": ".well, .panel, article, section",
        "title": "h2::text, h3::text",
        "description": "p::text",
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
