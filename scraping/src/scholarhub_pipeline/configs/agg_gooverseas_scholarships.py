"""GoOverseas Scholarships source configuration."""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseAggregatorConfig


@dataclass
class Config(BaseAggregatorConfig):
    """GoOverseas Scholarships aggregator config.

    CF-protected (403 on plain fetch). Study abroad funding guides.
    """

    name: str = "GoOverseas Scholarships"
    url: str = "https://www.gooverseas.com/scholarships"
    source_id: str = "gooverseas_scholarships"
    primary_method: str = "scrapling"
    secondary_method: str | None = None
    rate_limit_delay: float = 3.0
    selectors: dict[str, str] = field(default_factory=lambda: {
        "listing": ".search-result, .result-card, .listing-card, article.scholarship",
        "title": "h2 a::text, h3 a::text, .card-title::text, .result-title a::text",
        "deadline": ".deadline::text, .date::text, .meta-date::text",
        "country": ".country::text, .location::text, .destination::text",
        "amount": ".amount::text, .funding::text, .award::text",
        "detail_link": "h2 a::attr(href), h3 a::attr(href), .card-title a::attr(href)",
        "next_page": ".pagination .next::attr(href), a.next::attr(href)",
    })
    field_mappings: dict[str, str] = field(default_factory=lambda: {
        "title": "title",
        "deadline": "application_deadline",
        "amount": "award_amount",
        "detail_link": "source_url",
        "country": "host_country",
    })
    pagination: dict | None = field(default_factory=lambda: {
        "type": "url",
        "selector": ".pagination .next::attr(href), a.next::attr(href)",
        "max_pages": 25,
    })
    detail_page: bool = True
    detail_selectors: dict[str, str] | None = field(default_factory=lambda: {
        "description": ".description::text, .overview::text, .content p::text",
        "eligibility": ".eligibility::text, .requirements::text",
        "application_url": "a.apply::attr(href), a[href*='apply']::attr(href)",
    })


CONFIG = Config()
