"""Spanish Government Scholarships (AECID) source configuration."""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseOfficialConfig


@dataclass
class Config(BaseOfficialConfig):
    """Spanish Government Scholarships (AECID) official program config."""

    name: str = "Spanish Government Scholarships (AECID)"
    url: str = "https://www.aecid.es/en/grants-and-scholarships"
    source_id: str = "spanish_government_scholarships_aecid"
    primary_method: str = "scrape"
    secondary_method: str | None = "scrapling"
    selectors: dict[str, str] = field(default_factory=lambda: {'listing': '.scholarship-item, .programme, article, .content-item, section.scholarship', 'title': 'h1::text, h2::text, h3::text, .programme-title::text', 'deadline': '.deadline::text, .date::text, .important-date::text', 'eligibility': '.eligibility::text, .requirements::text, .criteria::text', 'amount': '.amount::text, .funding::text, .stipend::text', 'detail_link': 'a::attr(href)'})
    field_mappings: dict[str, str] = field(default_factory=lambda: {'title': 'title', 'deadline': 'application_deadline', 'amount': 'award_amount', 'detail_link': 'source_url', 'eligibility': 'eligibility_criteria'})
    pagination: dict | None = None
    detail_page: bool = False
    detail_selectors: dict[str, str] | None = None


CONFIG = Config()
