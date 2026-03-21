"""StudyAbroad.com Scholarships source configuration."""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseAggregatorConfig


@dataclass
class Config(BaseAggregatorConfig):
    """StudyAbroad.com Scholarships aggregator config.

    WordPress/Salient theme with WP Rocket lazy-loading.
    Ajax content transitions. Server-rendered with JS enhancement.
    """

    name: str = "StudyAbroad.com Scholarships"
    url: str = "https://www.studyabroad.com/scholarships"
    source_id: str = "studyabroad_scholarships"
    primary_method: str = "scrape"
    secondary_method: str | None = "scrapling"
    rate_limit_delay: float = 3.0
    selectors: dict[str, str] = field(default_factory=lambda: {
        "listing": "article, .post, .entry, .scholarship-item, .listing-card",
        "title": "h2 a::text, h3 a::text, .entry-title a::text, .post-title a::text",
        "deadline": ".deadline::text, .date::text, time::text",
        "country": ".country::text, .location::text, .destination::text",
        "amount": ".amount::text, .funding::text, .scholarship-value::text",
        "degree": ".degree::text, .level::text, .study-level::text",
        "detail_link": "h2 a::attr(href), h3 a::attr(href), .entry-title a::attr(href)",
        "next_page": ".pagination .next::attr(href), a.next::attr(href), .nav-next a::attr(href)",
    })
    field_mappings: dict[str, str] = field(default_factory=lambda: {
        "title": "title",
        "deadline": "application_deadline",
        "amount": "award_amount",
        "detail_link": "source_url",
        "country": "host_country",
        "degree": "degree_levels",
    })
    pagination: dict | None = field(default_factory=lambda: {
        "type": "url",
        "selector": ".pagination .next::attr(href), a.next::attr(href)",
        "max_pages": 20,
    })
    detail_page: bool = True
    detail_selectors: dict[str, str] | None = field(default_factory=lambda: {
        "description": ".description::text, .content p::text, article p::text",
        "eligibility": ".eligibility::text, .requirements::text",
        "application_url": "a.apply::attr(href), a[href*='apply']::attr(href)",
    })


CONFIG = Config()
