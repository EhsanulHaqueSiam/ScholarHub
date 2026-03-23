"""Reach Oxford Scholarships source configuration."""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseFoundationConfig


@dataclass
class Config(BaseFoundationConfig):
    """Reach Oxford Scholarships foundation config."""

    name: str = "Reach Oxford Scholarships"
    url: str = "https://www.ox.ac.uk/admissions/undergraduate/fees-and-funding/oxford-support/reach-oxford-scholarship"
    source_id: str = "reach_oxford_scholarships"
    primary_method: str = "scrape"
    secondary_method: str | None = "scrapling"
    selectors: dict[str, str] = field(default_factory=lambda: {
        "listing": "main, article",
        "title": "h1::text, h2::text",
        "deadline": "time::text, .deadline::text, .date::text, .closing-date::text",
        "eligibility": ".eligibility::text, .requirements::text, .criteria::text",
        "amount": ".amount::text, .funding::text, .award::text",
        "detail_link": "a[href*='reach-oxford-scholarship']::attr(href), h1 a::attr(href)",
    })
    field_mappings: dict[str, str] = field(default_factory=lambda: {'title': 'title', 'deadline': 'application_deadline', 'amount': 'award_amount', 'detail_link': 'source_url', 'eligibility': 'eligibility_criteria'})
    pagination: dict | None = None
    detail_page: bool = False
    detail_selectors: dict[str, str] | None = None


CONFIG = Config()
