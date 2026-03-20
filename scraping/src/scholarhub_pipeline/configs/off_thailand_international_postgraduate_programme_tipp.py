"""Thailand International Postgraduate Programme (TIPP) source configuration."""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseOfficialConfig


@dataclass
class Config(BaseOfficialConfig):
    """Thailand International Postgraduate Programme (TIPP) official program config."""

    name: str = "Thailand International Postgraduate Programme (TIPP)"
    url: str = "https://www.tica.thaigov.net/main/en/other/7929"
    source_id: str = "thailand_international_postgraduate_programme_tipp"
    primary_method: str = "scrape"
    secondary_method: str | None = "scrapling"
    selectors: dict[str, str] = field(default_factory=lambda: {'listing': '.scholarship-item, .programme, article, .content-item, section.scholarship', 'title': 'h1::text, h2::text, h3::text, .programme-title::text', 'deadline': '.deadline::text, .date::text, .important-date::text', 'eligibility': '.eligibility::text, .requirements::text, .criteria::text', 'amount': '.amount::text, .funding::text, .stipend::text', 'detail_link': 'a::attr(href)'})
    field_mappings: dict[str, str] = field(default_factory=lambda: {'title': 'title', 'deadline': 'application_deadline', 'amount': 'award_amount', 'detail_link': 'source_url', 'eligibility': 'eligibility_criteria'})
    pagination: dict | None = None
    detail_page: bool = False
    detail_selectors: dict[str, str] | None = None


CONFIG = Config()
