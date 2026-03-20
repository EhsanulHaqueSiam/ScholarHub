"""Wellcome Trust PhD Studentships source configuration."""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseFoundationConfig


@dataclass
class Config(BaseFoundationConfig):
    """Wellcome Trust PhD Studentships foundation config."""

    name: str = "Wellcome Trust PhD Studentships"
    url: str = "https://wellcome.org/grant-funding/schemes/phd-programmes"
    source_id: str = "wellcome_trust_phd_studentships"
    primary_method: str = "scrape"
    secondary_method: str | None = "scrapling"
    selectors: dict[str, str] = field(default_factory=lambda: {'listing': '.scholarship-item, .programme, article, .grant-item, .fellowship', 'title': 'h2::text, h3::text, .title::text, .fellowship-title::text', 'deadline': '.deadline::text, .date::text, .closing-date::text', 'eligibility': '.eligibility::text, .requirements::text', 'amount': '.amount::text, .funding::text, .award::text', 'detail_link': 'h2 a::attr(href), h3 a::attr(href), a::attr(href)'})
    field_mappings: dict[str, str] = field(default_factory=lambda: {'title': 'title', 'deadline': 'application_deadline', 'amount': 'award_amount', 'detail_link': 'source_url', 'eligibility': 'eligibility_criteria'})
    pagination: dict | None = None
    detail_page: bool = True
    detail_selectors: dict[str, str] | None = field(default_factory=lambda: {'description': '.description::text, .overview::text, .content p::text, article p::text', 'eligibility': '.eligibility::text, .requirements::text, .criteria::text', 'application_url': "a.apply::attr(href), a[href*='apply']::attr(href), a.btn-primary::attr(href)"})


CONFIG = Config()
