"""Chinese Government Scholarship (CSC) source configuration."""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseOfficialConfig


@dataclass
class Config(BaseOfficialConfig):
    """Chinese Government Scholarship (CSC) official program config."""

    name: str = "Chinese Government Scholarship (CSC)"
    # Campuschina endpoints are intermittently unreachable from crawler regions;
    # use a stable CSC-focused scholarship listing endpoint.
    url: str = "https://www.chinesescholarshipcouncil.com/"
    source_id: str = "chinese_government_scholarship_csc"
    primary_method: str = "scrape"
    secondary_method: str | None = "scrapling"
    selectors: dict[str, str] = field(default_factory=lambda: {'listing': '.scholarship-item, .programme, article, .content-item, section.scholarship', 'title': 'h1::text, h2::text, h3::text, .programme-title::text', 'deadline': '.deadline::text, .date::text, .important-date::text', 'eligibility': '.eligibility::text, .requirements::text, .criteria::text', 'amount': '.amount::text, .funding::text, .stipend::text', 'detail_link': 'a::attr(href)'})
    field_mappings: dict[str, str] = field(default_factory=lambda: {'title': 'title', 'deadline': 'application_deadline', 'amount': 'award_amount', 'detail_link': 'source_url', 'eligibility': 'eligibility_criteria'})
    pagination: dict | None = field(default_factory=lambda: {'type': 'url', 'selector': '.pagination .next::attr(href), a.next::attr(href)', 'max_pages': 5})
    detail_page: bool = True
    detail_selectors: dict[str, str] | None = field(default_factory=lambda: {'description': '.description::text, .overview::text, .content p::text, article p::text', 'eligibility': '.eligibility::text, .requirements::text, .criteria::text', 'application_url': "a.apply::attr(href), a[href*='apply']::attr(href), a.btn-primary::attr(href)"})
    method_timeout_seconds: float = 12.0


CONFIG = Config()
