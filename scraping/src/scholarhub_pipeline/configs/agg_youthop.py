"""YouthOp source configuration.

Targets YouthOp.com global opportunities portal. Uses card-based
grid with categories, titles, locations, and deadlines. WordPress
API is blocked, requiring scrapling for content extraction. Content
is partially JS-rendered via AJAX.
"""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseAggregatorConfig


@dataclass
class Config(BaseAggregatorConfig):
    """YouthOp aggregator config."""

    name: str = "YouthOp"
    url: str = "https://youthop.com/scholarships"
    source_id: str = "youthop"
    primary_method: str = "scrape"
    secondary_method: str | None = "scrapling"
    selectors: dict[str, str] = field(default_factory=lambda: {
        "listing": ".opportunit-item, article, .card, .post, .entry",
        "title": "h3::text, h2 a::text, h3 a::text, .card-title::text",
        "detail_link": "a::attr(href), h3 a::attr(href), .card a::attr(href)",
        "category": "strong::text, .category::text, .badge::text",
        "deadline": ".deadline::text, .time-remaining::text",
        "description": "p::text, .excerpt::text, .summary::text",
    })
    field_mappings: dict[str, str] = field(default_factory=lambda: {
        "title": "title",
        "detail_link": "source_url",
        "category": "scholarship_type",
        "deadline": "application_deadline",
        "description": "description",
    })
    pagination: dict | None = field(default_factory=lambda: {
        "type": "url",
        "selector": ".pagination .next::attr(href), a.next::attr(href)",
        "max_pages": 50,
    })
    detail_page: bool = True
    detail_selectors: dict[str, str] | None = field(default_factory=lambda: {
        "description": ".entry-content p::text, article p::text, .content p::text",
        "eligibility": ".eligibility::text, .requirements li::text",
        "deadline": ".deadline::text, .date::text",
        "amount": ".amount::text, .value::text",
        "country": ".country::text, .location::text",
    })
    rate_limit_delay: float = 1.5
    method_timeout_seconds: float = 6.0


CONFIG = Config()
