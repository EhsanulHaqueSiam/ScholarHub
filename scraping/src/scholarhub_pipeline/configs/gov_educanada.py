"""EduCanada Scholarships source configuration.

Targets the EduCanada JSON API endpoint which returns scholarship records
from the Canadian government portal. Single request, no pagination needed.
Note: the "program" field contains HTML with <a> tags.
"""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseGovernmentConfig


@dataclass
class Config(BaseGovernmentConfig):
    """EduCanada Scholarships government config."""

    name: str = "EduCanada Scholarships"
    url: str = "https://www.educanada.ca/scholarships-bourses/assets/forms/data.json"
    source_id: str = "educanada_scholarships"
    primary_method: str = "api"
    secondary_method: str | None = None
    selectors: dict[str, str] = field(default_factory=lambda: {
        "format": "json",
        "items_path": "",
        "host_country_default": "Canada",
    })
    field_mappings: dict[str, str] = field(default_factory=lambda: {
        "program": "title",
        "organization": "provider_organization",
        "citizenship": "eligibility_criteria",
    })
    pagination: dict | None = None
    detail_page: bool = False
    rate_limit_delay: float = 2.0


CONFIG = Config()
