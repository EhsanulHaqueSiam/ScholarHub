"""ScholarshipTab source configuration.

Targets ScholarshipTab.com which lists scholarships for African
and Asian students. Returns 403 on direct access, requiring scrapling
method for anti-bot bypass.
"""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseAggregatorConfig


@dataclass
class Config(BaseAggregatorConfig):
    """ScholarshipTab aggregator config."""

    name: str = "ScholarshipTab"
    url: str = "https://scholarshiptab.com"
    source_id: str = "scholarshiptab"
    primary_method: str = "scrapling"
    secondary_method: str | None = None
    selectors: dict[str, str] = field(default_factory=lambda: {
        "listing": "article, .post, .entry, .scholarship-item, .card",
        "title": "h2 a::text, h3 a::text, .entry-title a::text, .card-title::text",
        "detail_link": "h2 a::attr(href), h3 a::attr(href), .entry-title a::attr(href)",
        "deadline": ".deadline::text, .date::text, time::text",
        "country": ".country::text, .location::text, .tag::text",
        "description": "p::text, .entry-summary p::text, .excerpt::text",
    })
    field_mappings: dict[str, str] = field(default_factory=lambda: {
        "title": "title",
        "detail_link": "source_url",
        "deadline": "application_deadline",
        "country": "host_country",
        "description": "description",
    })
    pagination: dict | None = field(default_factory=lambda: {
        "type": "url",
        "selector": ".pagination .next::attr(href), a.next::attr(href), .nav-next a::attr(href)",
        "max_pages": 50,
    })
    detail_page: bool = True
    detail_selectors: dict[str, str] | None = field(default_factory=lambda: {
        "description": ".entry-content p::text, article p::text, .content p::text",
        "eligibility": ".eligibility::text, .requirements li::text, .entry-content ul li::text",
        "deadline": ".deadline::text, .date::text",
        "amount": ".amount::text, .value::text",
    })
    rate_limit_delay: float = 3.0


CONFIG = Config()
