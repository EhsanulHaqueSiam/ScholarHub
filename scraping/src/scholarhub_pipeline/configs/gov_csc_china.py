"""Campus China / CSC (China Scholarship Council) source configuration.

Uses a stable CSC-focused scholarship endpoint to reduce intermittent DNS and
WAF issues observed on campuschina.org from some crawler regions.
"""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseGovernmentConfig


@dataclass
class Config(BaseGovernmentConfig):
    """CSC China government config."""

    name: str = "CSC China"
    url: str = "https://www.chinesescholarshipcouncil.com/"
    source_id: str = "csc_china"
    primary_method: str = "scrape"
    secondary_method: str | None = "scrapling"
    selectors: dict[str, str] = field(default_factory=lambda: {
        "listing": ".scholarship-item, .list-item, article, .content-item, li.item, .news-list li, .scholarship-list li",
        "title": "h3 a::text, h4 a::text, .title a::text, .item-title a::text, a::text",
        "description": "p::text, .summary::text, .desc::text, .item-desc::text",
        "detail_link": "h3 a::attr(href), h4 a::attr(href), .title a::attr(href), a::attr(href)",
        "host_country_default": "China",
    })
    field_mappings: dict[str, str] = field(default_factory=lambda: {
        "title": "title",
        "description": "description",
        "detail_link": "source_url",
        "eligibility": "eligibility_criteria",
        "benefits": "funding_details",
        "level": "degree_level",
        "deadline": "application_deadline",
    })
    pagination: dict | None = field(default_factory=lambda: {
        "type": "url",
        "selector": "a.next::attr(href), .pagination a.next::attr(href), .page-next a::attr(href)",
        "max_pages": 10,
    })
    detail_page: bool = True
    detail_selectors: dict[str, str] | None = field(default_factory=lambda: {
        "description": ".article-content p::text, .detail-content p::text, .content p::text",
        "eligibility": ".eligibility::text, .requirements li::text, .criteria p::text",
        "benefits": ".benefits::text, .coverage li::text, .funding p::text",
        "level": ".level::text, .degree::text, .programme-level::text",
        "deadline": ".deadline::text, .date::text, .application-period::text",
    })
    rate_limit_delay: float = 2.0
    method_timeout_seconds: float = 12.0


CONFIG = Config()
