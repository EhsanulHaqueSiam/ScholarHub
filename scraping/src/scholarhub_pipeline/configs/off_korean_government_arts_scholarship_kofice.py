"""Korean Government Arts Scholarship (KOFICE) source configuration."""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseOfficialConfig


@dataclass
class Config(BaseOfficialConfig):
    """Korean Government Arts Scholarship (KOFICE) official program config."""

    name: str = "Korean Government Arts Scholarship (KOFICE)"
    url: str = "https://www.kofice.or.kr/eng/"
    source_id: str = "korean_government_arts_scholarship_kofice"
    primary_method: str = "scrapling"
    secondary_method: str | None = "scrape"
    selectors: dict[str, str] = field(default_factory=lambda: {'listing': '.scholarship-item, .programme, article, .content-item, section.scholarship', 'title': 'h1::text, h2::text, h3::text, .programme-title::text', 'deadline': '.deadline::text, .date::text, .important-date::text', 'eligibility': '.eligibility::text, .requirements::text, .criteria::text', 'amount': '.amount::text, .funding::text, .stipend::text', 'detail_link': 'a::attr(href)'})
    field_mappings: dict[str, str] = field(default_factory=lambda: {'title': 'title', 'deadline': 'application_deadline', 'amount': 'award_amount', 'detail_link': 'source_url', 'eligibility': 'eligibility_criteria'})
    pagination: dict | None = None
    detail_page: bool = False
    detail_selectors: dict[str, str] | None = None
    method_timeout_seconds: float = 12.0


CONFIG = Config()
