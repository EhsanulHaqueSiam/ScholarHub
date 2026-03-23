"""University of Tokyo MEXT Research Scholarship source configuration."""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseOfficialConfig


@dataclass
class Config(BaseOfficialConfig):
    """University of Tokyo MEXT Research Scholarship official program config."""

    name: str = "University of Tokyo MEXT Research Scholarship"
    # Use a stable MEXT scholarship listing endpoint; historical U-Tokyo URL
    # often returns 404 and causes long anti-bot fallbacks.
    url: str = "https://www.studyinjapan.go.jp/en/planning/scholarships/mext-scholarships/"
    source_id: str = "university_of_tokyo_mext_research_scholarship"
    primary_method: str = "scrape"
    secondary_method: str | None = None
    selectors: dict[str, str] = field(default_factory=lambda: {
        "listing": "table tr, .scholarship-item, .programme, article, .content-item, section.scholarship",
        "title": "td:nth-child(1)::text, td:nth-child(2)::text, th::text, h1::text, h2::text, h3::text, .programme-title::text",
        "deadline": ".deadline::text, .date::text, .important-date::text, td:nth-child(4)::text",
        "eligibility": ".eligibility::text, .requirements::text, .criteria::text, td:nth-child(3)::text",
        "amount": ".amount::text, .funding::text, .stipend::text",
        "detail_link": "a::attr(href)",
    })
    field_mappings: dict[str, str] = field(default_factory=lambda: {
        "title": "title",
        "deadline": "application_deadline",
        "amount": "award_amount",
        "detail_link": "source_url",
        "eligibility": "eligibility_criteria",
    })
    pagination: dict | None = None
    detail_page: bool = False
    detail_selectors: dict[str, str] | None = None
    method_timeout_seconds: float = 12.0


CONFIG = Config()
