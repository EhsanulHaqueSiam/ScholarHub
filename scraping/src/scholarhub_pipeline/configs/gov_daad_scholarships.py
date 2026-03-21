"""DAAD (German Academic Exchange Service) Scholarships source configuration.

Targets the DAAD scholarship database at www2.daad.de which lists ~164
scholarships via AJAX-loaded paginated HTML. Results are loaded dynamically
via /ajax/ endpoint with page parameter. Detail pages provide full
programme descriptions, eligibility, and funding information.
"""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseGovernmentConfig


@dataclass
class Config(BaseGovernmentConfig):
    """DAAD Scholarship Database government config."""

    name: str = "DAAD Scholarship Database"
    url: str = "https://www2.daad.de/deutschland/stipendium/datenbank/en/21148-scholarship-database/?status=&origin=&subjectGrps=&daad=&q=&page=1&back=1"
    source_id: str = "daad_scholarship_database"
    primary_method: str = "scrapling"
    secondary_method: str | None = "scrape"
    selectors: dict[str, str] = field(default_factory=lambda: {
        "listing": ".stipendium-result, .result-item, .listing-item, article.scholarship, .media",
        "title": "h3 a::text, h4 a::text, .title a::text, .media-heading a::text",
        "description_short": "p::text, .description::text, .media-body p::text",
        "detail_link": "h3 a::attr(href), h4 a::attr(href), .title a::attr(href), .media-heading a::attr(href)",
        "next_page": "a.next::attr(href), .pagination .next a::attr(href), li.next a::attr(href)",
        "host_country_default": "Germany",
    })
    field_mappings: dict[str, str] = field(default_factory=lambda: {
        "title": "title",
        "description_short": "description",
        "detail_link": "source_url",
        "target_group": "eligibility_criteria",
        "benefits": "funding_details",
        "deadline": "application_deadline",
        "duration": "award_amount",
    })
    pagination: dict | None = field(default_factory=lambda: {
        "type": "page_num",
        "selector": "a.next::attr(href), .pagination .next a::attr(href)",
        "max_pages": 20,
    })
    detail_page: bool = True
    detail_selectors: dict[str, str] | None = field(default_factory=lambda: {
        "description_short": ".article-text::text, .detail-content p::text, .tab-content p::text",
        "target_group": ".target-group::text, #target-group p::text",
        "benefits": ".benefits::text, #benefits p::text, .funding-details::text",
        "deadline": ".deadline::text, .application-deadline::text, #dates p::text",
        "duration": ".duration::text, #duration p::text",
    })
    rate_limit_delay: float = 3.0


CONFIG = Config()
