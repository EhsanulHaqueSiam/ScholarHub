"""New Zealand Government Scholarships source configuration.

Targets the New Zealand Government scholarships portal at
scholarships.govt.nz. ECONNREFUSED on direct access, requiring
scrapling method. Lists NZ government-funded scholarship programmes.
"""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseGovernmentConfig


@dataclass
class Config(BaseGovernmentConfig):
    """NZ Government Scholarships government config."""

    name: str = "NZ Government Scholarships"
    url: str = "https://www.nzscholarships.govt.nz/"
    source_id: str = "nz_government_scholarships"
    primary_method: str = "scrapling"
    secondary_method: str | None = None
    selectors: dict[str, str] = field(default_factory=lambda: {
        "listing": ".scholarship-item, .result-item, article, .card, .listing-item",
        "title": "h2 a::text, h3 a::text, .title::text, .card-title::text",
        "detail_link": "h2 a::attr(href), h3 a::attr(href), .title a::attr(href)",
        "description": "p::text, .summary::text, .description::text",
        "host_country_default": "New Zealand",
    })
    field_mappings: dict[str, str] = field(default_factory=lambda: {
        "title": "title",
        "detail_link": "source_url",
        "description": "description",
    })
    pagination: dict | None = field(default_factory=lambda: {
        "type": "url",
        "selector": ".pagination .next::attr(href), a.next::attr(href)",
        "max_pages": 10,
    })
    detail_page: bool = True
    detail_selectors: dict[str, str] | None = field(default_factory=lambda: {
        "description": ".content p::text, article p::text, .field-body p::text",
        "eligibility": ".eligibility p::text, .requirements li::text",
        "deadline": ".deadline::text, .closing-date::text",
        "amount": ".amount::text, .value::text",
    })
    rate_limit_delay: float = 5.0
    method_timeout_seconds: float = 20.0


CONFIG = Config()
