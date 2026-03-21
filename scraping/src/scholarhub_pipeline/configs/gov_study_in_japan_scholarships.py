"""Study in Japan Scholarships source configuration.

Targets the studyinjapan.go.jp CSV download endpoint which returns
~682 scholarship/tuition-reduction records. Uses ApiScraper with
CSV format support (single request, no pagination needed).
"""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseGovernmentConfig


@dataclass
class Config(BaseGovernmentConfig):
    """Study in Japan Scholarships government config."""

    name: str = "Study in Japan Scholarships"
    url: str = "https://www.studyinjapan.go.jp/en/search-for-scholarships/download_tution-reduction.php?lang=en&go=go&offset=0&limit=9999"
    source_id: str = "study_in_japan_scholarships"
    primary_method: str = "api"
    secondary_method: str | None = None
    selectors: dict[str, str] = field(default_factory=lambda: {
        "format": "csv",
        "host_country_default": "Japan",
    })
    field_mappings: dict[str, str] = field(default_factory=lambda: {
        "School Name": "provider_organization",
        "Webpage": "application_url",
        "Type": "institution_type",
        "Applicable Courses": "degree_level",
        "Program Name": "title",
        "Scholarship": "has_scholarship",
        "Enrollment fee reduction": "enrollment_fee_reduction",
        "Application fee reduction": "application_fee_reduction",
        "Tuition fee reduction": "funding_details",
        "Settling-in Allowance": "settling_in_allowance",
        "Other Financial Support": "description",
        "E-mail": "contact_email",
        "Inquiry form": "source_url",
    })
    pagination: dict | None = None
    detail_page: bool = False
    rate_limit_delay: float = 3.0


CONFIG = Config()
