"""Study Australia Providers source configuration.

Targets the ACIR Inertia.js API at search.studyaustralia.gov.au/providers.
Returns 2,281 education providers with CRICOS codes, campus locations,
and descriptions for enriching scholarship records.
"""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseGovernmentConfig


@dataclass
class Config(BaseGovernmentConfig):
    """Study Australia Providers government config."""

    name: str = "Study Australia Providers"
    url: str = "https://search.studyaustralia.gov.au/providers"
    source_id: str = "study_australia_providers"
    primary_method: str = "inertia"
    secondary_method: str | None = "scrape"
    selectors: dict[str, str] = field(default_factory=lambda: {
        "items_key": "providers",
    })
    field_mappings: dict[str, str] = field(default_factory=lambda: {
        "name": "title",
        "description": "description",
        "web_address": "application_url",
    })
    pagination: dict | None = field(default_factory=lambda: {
        "type": "page_num",
        "max_pages": 250,
    })
    detail_page: bool = False
    rate_limit_delay: float = 1.5


CONFIG = Config()
