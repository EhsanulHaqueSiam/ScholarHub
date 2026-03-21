"""Going Merry Scholarships source configuration.

Going Merry was acquired by Earnest and the scholarship platform
has been shut down (redirects to earnest.com closing FAQs).
Config is retained but marked with inactive URL. The service
no longer provides scholarship listings.
"""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseAggregatorConfig


@dataclass
class Config(BaseAggregatorConfig):
    """Going Merry Scholarships aggregator config."""

    name: str = "Going Merry Scholarships"
    url: str = "https://www.goingmerry.com/scholarships"
    source_id: str = "goingmerry_scholarships"
    primary_method: str = "scrapling"
    secondary_method: str | None = None
    selectors: dict[str, str] = field(default_factory=lambda: {
        "listing": ".scholarship-card, .card, article, .result-item",
        "title": "h2 a::text, h3 a::text, .card-title::text",
        "detail_link": "h2 a::attr(href), h3 a::attr(href), .card a::attr(href)",
        "amount": ".amount::text, .award::text",
        "deadline": ".deadline::text, .date::text",
        "description": "p::text, .card-body p::text",
    })
    field_mappings: dict[str, str] = field(default_factory=lambda: {
        "title": "title",
        "detail_link": "source_url",
        "amount": "award_amount",
        "deadline": "application_deadline",
        "description": "description",
    })
    pagination: dict | None = None
    detail_page: bool = False
    rate_limit_delay: float = 3.0


CONFIG = Config()
