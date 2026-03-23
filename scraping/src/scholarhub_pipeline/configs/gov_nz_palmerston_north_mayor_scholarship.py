"""Palmerston North Mayor's Goodwill Ambassador Scholarship source configuration.

Targets the Study With New Zealand government portal entry for this
scholarship. NZ$1,000 towards first year tuition for international
students. Site uses rate limiting/bot protection requiring scrapling.
URL: https://www.studywithnewzealand.govt.nz/en/study-options/scholarship/ba974507-8483-4638-ad3f-de4f5aae2e71
"""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseGovernmentConfig


@dataclass
class Config(BaseGovernmentConfig):
    """Palmerston North Mayor's Scholarship government config."""

    name: str = "Palmerston North Mayor's Goodwill Ambassador Scholarship"
    url: str = "https://www.studywithnewzealand.govt.nz/en/study-options/scholarship/ba974507-8483-4638-ad3f-de4f5aae2e71"
    source_id: str = "nz_palmerston_north_mayor_scholarship"
    primary_method: str = "scrapling"
    secondary_method: str | None = None
    selectors: dict[str, str] = field(default_factory=lambda: {
        "listing": "article, .content, main",
        "title": "h1::text, h2::text",
        "description": "article p::text, .content p::text",
        "host_country_default": "New Zealand",
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
