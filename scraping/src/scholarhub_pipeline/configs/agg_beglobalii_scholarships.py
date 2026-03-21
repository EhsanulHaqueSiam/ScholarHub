"""BeGlobalii Scholarships source configuration.

Targets the BeGlobalii (now beglobali.com) study abroad scholarship
platform. Redirects from beglobalii.com to beglobali.com. Uses a
React-based dynamic app that requires scrapling for content extraction.
"""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseAggregatorConfig


@dataclass
class Config(BaseAggregatorConfig):
    """BeGlobalii Scholarships aggregator config."""

    name: str = "BeGlobalii Scholarships"
    url: str = "https://beglobali.com/"
    source_id: str = "beglobalii_scholarships"
    primary_method: str = "scrapling"
    secondary_method: str | None = None
    selectors: dict[str, str] = field(default_factory=lambda: {
        "listing": ".scholarship-card, .card, article, .opportunity-item, .listing-item",
        "title": "h2 a::text, h3 a::text, .card-title::text, a::text",
        "detail_link": "h2 a::attr(href), h3 a::attr(href), .card a::attr(href)",
        "description": "p::text, .card-body p::text, .summary::text",
        "country": ".country::text, .location::text",
    })
    field_mappings: dict[str, str] = field(default_factory=lambda: {
        "title": "title",
        "detail_link": "source_url",
        "description": "description",
        "country": "host_country",
    })
    pagination: dict | None = None
    detail_page: bool = True
    detail_selectors: dict[str, str] | None = field(default_factory=lambda: {
        "description": ".content p::text, article p::text",
        "eligibility": ".eligibility p::text, ul li::text",
        "deadline": ".deadline::text, .date::text",
    })
    rate_limit_delay: float = 3.0


CONFIG = Config()
