"""Australia Research Training Program (RTP) source configuration.

Targets the Australian Government Department of Education Research Training
Program page. The site blocks non-browser TLS fingerprints, requiring
scrapling for reliable access.
URL: https://www.education.gov.au/research-block-grants/research-training-program
"""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseGovernmentConfig


@dataclass
class Config(BaseGovernmentConfig):
    """Australia Research Training Program government config."""

    name: str = "Australia Research Training Program"
    url: str = "https://www.education.gov.au/research-block-grants/research-training-program"
    source_id: str = "australia_research_training_program"
    primary_method: str = "scrapling"
    secondary_method: str | None = None
    selectors: dict[str, str] = field(default_factory=lambda: {
        "listing": "article, main, .field-body",
        "title": "h1::text",
        "description": "article p::text, section p::text",
        "host_country_default": "Australia",
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
