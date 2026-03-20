"""DAAD Scholarships source configuration."""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseOfficialConfig


@dataclass
class Config(BaseOfficialConfig):
    """DAAD Scholarships official program config."""

    name: str = "DAAD Scholarships"
    url: str = "https://www.daad.de/en/study-and-research-in-germany/scholarships/"
    source_id: str = "daad_scholarships"
    primary_method: str = "api"
    secondary_method: str | None = "scrape"
    selectors: dict[str, str] = field(default_factory=lambda: {'items_path': 'results, data, items', 'title': 'title, name', 'deadline': 'deadline, application_deadline, due_date', 'country': 'country, location, host_country', 'amount': 'amount, funding, award_amount, value', 'url': 'url, link, application_url'})
    field_mappings: dict[str, str] = field(default_factory=lambda: {'title': 'title', 'deadline': 'application_deadline', 'country': 'host_country', 'amount': 'award_amount', 'url': 'application_url'})
    pagination: dict | None = field(default_factory=lambda: {'type': 'cursor', 'param': 'page', 'max_pages': 100})
    detail_page: bool = True
    detail_selectors: dict[str, str] | None = field(default_factory=lambda: {'description': '.description::text, .overview::text, .content p::text, article p::text', 'eligibility': '.eligibility::text, .requirements::text, .criteria::text', 'application_url': "a.apply::attr(href), a[href*='apply']::attr(href), a.btn-primary::attr(href)"})


CONFIG = Config()
