"""Leverhulme Trust Study Abroad Studentships source configuration."""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseFoundationConfig


@dataclass
class Config(BaseFoundationConfig):
    """Leverhulme Trust Study Abroad Studentships foundation config."""

    name: str = "Leverhulme Trust Study Abroad Studentships"
    url: str = "https://www.leverhulme.ac.uk/study-abroad-studentships"
    source_id: str = "leverhulme_trust_study_abroad_studentships"
    primary_method: str = "scrape"
    secondary_method: str | None = "scrapling"
    selectors: dict[str, str] = field(default_factory=lambda: {'listing': '.scholarship-item, .programme, article, .grant-item, .fellowship', 'title': 'h2::text, h3::text, .title::text, .fellowship-title::text', 'deadline': '.deadline::text, .date::text, .closing-date::text', 'eligibility': '.eligibility::text, .requirements::text', 'amount': '.amount::text, .funding::text, .award::text', 'detail_link': 'h2 a::attr(href), h3 a::attr(href), a::attr(href)'})
    field_mappings: dict[str, str] = field(default_factory=lambda: {'title': 'title', 'deadline': 'application_deadline', 'amount': 'award_amount', 'detail_link': 'source_url', 'eligibility': 'eligibility_criteria'})
    pagination: dict | None = None
    detail_page: bool = False
    detail_selectors: dict[str, str] | None = None


CONFIG = Config()
