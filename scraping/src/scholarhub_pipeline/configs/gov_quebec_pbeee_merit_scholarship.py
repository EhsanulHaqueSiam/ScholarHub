"""Quebec PBEEE Merit Scholarship source configuration.

Targets the Fonds de recherche du Quebec (FRQ) Merit Scholarship Program
for Foreign Students (PBEEE) page. Comprehensive program page with
objectives, eligibility, and scholarship values.
URL: https://frq.gouv.qc.ca/en/program/merit-scholarship-program-for-foreign-students-pbeee/
"""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseGovernmentConfig


@dataclass
class Config(BaseGovernmentConfig):
    """Quebec PBEEE Merit Scholarship government config."""

    name: str = "Quebec PBEEE Merit Scholarship"
    url: str = "https://frq.gouv.qc.ca/en/program/merit-scholarship-program-for-foreign-students-pbeee/"
    source_id: str = "quebec_pbeee_merit_scholarship"
    primary_method: str = "scrape"
    secondary_method: str | None = "scrapling"
    selectors: dict[str, str] = field(default_factory=lambda: {
        "listing": "article, .entry-content",
        "title": "h1::text",
        "description": "#objectives ~ p::text",
        "amount": "#value-of-scholarships ~ p::text, #value-of-scholarships ~ ul li::text",
        "eligibility": "#eligibility-requirements-citizenship-and-residence ~ p::text",
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
