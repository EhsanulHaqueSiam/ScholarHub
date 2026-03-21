"""Scholly Scholarships source configuration.

Scholly (myscholly.com) has been acquired by Sallie Mae and now
redirects to sallie.com/scholarships/scholly. The platform provides
a filter-based scholarship search with categories including award
amount, major, state, and type. Uses scrapling for JS-rendered results.
"""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseAggregatorConfig


@dataclass
class Config(BaseAggregatorConfig):
    """Scholly Scholarships aggregator config."""

    name: str = "Scholly Scholarships"
    url: str = "https://www.sallie.com/scholarships/scholly"
    source_id: str = "scholly_scholarships"
    primary_method: str = "scrapling"
    secondary_method: str | None = None
    selectors: dict[str, str] = field(default_factory=lambda: {
        "listing": ".scholarship-card, .result-item, .card, article",
        "title": "h2::text, h3::text, .card-title::text, .scholarship-name::text",
        "detail_link": "h2 a::attr(href), h3 a::attr(href), .card a::attr(href)",
        "amount": ".amount::text, .award-amount::text, .value::text",
        "deadline": ".deadline::text, .date::text",
        "description": "p::text, .card-body p::text, .description::text",
        "host_country_default": "United States",
    })
    field_mappings: dict[str, str] = field(default_factory=lambda: {
        "title": "title",
        "detail_link": "source_url",
        "amount": "award_amount",
        "deadline": "application_deadline",
        "description": "description",
    })
    pagination: dict | None = field(default_factory=lambda: {
        "type": "page_num",
        "selector": ".pagination .next::attr(href), a.next::attr(href)",
        "max_pages": 50,
    })
    detail_page: bool = False
    rate_limit_delay: float = 3.0


CONFIG = Config()
