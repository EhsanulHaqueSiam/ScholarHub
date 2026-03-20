"""Portuguese Government Scholarships (Camoes) source configuration."""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseOfficialConfig


@dataclass
class Config(BaseOfficialConfig):
    """Portuguese Government Scholarships (Camoes) official program config."""

    name: str = "Portuguese Government Scholarships (Camoes)"
    url: str = "https://www.instituto-camoes.pt/en/activity-camoes/what-we-do/scholarship-holders"
    source_id: str = "portuguese_government_scholarships_camoes"
    primary_method: str = "scrape"
    secondary_method: str | None = "scrapling"
    selectors: dict[str, str] = field(default_factory=lambda: {'listing': '.scholarship-item, .programme, article, .content-item, section.scholarship', 'title': 'h1::text, h2::text, h3::text, .programme-title::text', 'deadline': '.deadline::text, .date::text, .important-date::text', 'eligibility': '.eligibility::text, .requirements::text, .criteria::text', 'amount': '.amount::text, .funding::text, .stipend::text', 'detail_link': 'a::attr(href)'})
    field_mappings: dict[str, str] = field(default_factory=lambda: {'title': 'title', 'deadline': 'application_deadline', 'amount': 'award_amount', 'detail_link': 'source_url', 'eligibility': 'eligibility_criteria'})
    pagination: dict | None = None
    detail_page: bool = False
    detail_selectors: dict[str, str] | None = None


CONFIG = Config()
