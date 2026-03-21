"""Study Australia Scholarships source configuration.

Targets the ACIR (Australian Course Information Register) Inertia.js API
at search.studyaustralia.gov.au/scholarships. Returns 1024 scholarships
via paginated JSON using X-Inertia protocol.
"""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseGovernmentConfig


@dataclass
class Config(BaseGovernmentConfig):
    """Study Australia Scholarships government config."""

    name: str = "Study Australia Scholarships"
    url: str = "https://search.studyaustralia.gov.au/scholarships"
    source_id: str = "study_australia_scholarships"
    primary_method: str = "inertia"
    secondary_method: str | None = "scrape"
    selectors: dict[str, str] = field(default_factory=lambda: {
        "items_key": "scholarships",
    })
    field_mappings: dict[str, str] = field(default_factory=lambda: {
        "name": "title",
        "description": "description",
        "eligibility": "eligibility_criteria",
        "closing_date": "application_deadline",
        "amount_annual": "award_amount",
        "amount_comment": "funding_details",
        "web_address": "application_url",
        "scholarship_country_name": "host_country",
    })
    pagination: dict | None = field(default_factory=lambda: {
        "type": "page_num",
        "max_pages": 110,
    })
    detail_page: bool = False
    rate_limit_delay: float = 1.5


CONFIG = Config()
