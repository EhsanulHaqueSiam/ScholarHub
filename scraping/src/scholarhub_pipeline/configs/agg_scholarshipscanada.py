"""ScholarshipsCanada source configuration."""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseAggregatorConfig


@dataclass
class Config(BaseAggregatorConfig):
    """ScholarshipsCanada aggregator config.

    CF-protected (403 on plain fetch). Canadian scholarship database.
    Requires scrapling for Cloudflare bypass.
    """

    name: str = "ScholarshipsCanada"
    url: str = "https://www.scholarshipscanada.com"
    source_id: str = "scholarshipscanada"
    primary_method: str = "scrapling"
    secondary_method: str | None = None
    rate_limit_delay: float = 3.0
    selectors: dict[str, str] = field(default_factory=lambda: {
        "listing": ".scholarship-item, .result-item, article, .listing, .search-result",
        "title": "h2 a::text, h3 a::text, .title::text, .scholarship-title a::text",
        "deadline": ".deadline::text, .date::text, time::text",
        "amount": ".amount::text, .value::text, .award::text",
        "province": ".province::text, .location::text, .region::text",
        "degree": ".degree::text, .level::text, .study-level::text",
        "detail_link": "h2 a::attr(href), h3 a::attr(href), .title a::attr(href)",
        "next_page": ".pagination .next::attr(href), a.next::attr(href)",
    })
    field_mappings: dict[str, str] = field(default_factory=lambda: {
        "title": "title",
        "deadline": "application_deadline",
        "amount": "award_amount",
        "detail_link": "source_url",
        "province": "host_country",
        "degree": "degree_levels",
    })
    pagination: dict | None = field(default_factory=lambda: {
        "type": "url",
        "selector": ".pagination .next::attr(href), a.next::attr(href)",
        "max_pages": 50,
    })
    detail_page: bool = True
    detail_selectors: dict[str, str] | None = field(default_factory=lambda: {
        "description": ".description::text, .content p::text, article p::text",
        "eligibility": ".eligibility::text, .requirements::text",
        "application_url": "a.apply::attr(href), a[href*='apply']::attr(href)",
    })


CONFIG = Config()
