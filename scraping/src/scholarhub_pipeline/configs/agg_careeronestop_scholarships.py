"""CareerOneStop Scholarships source configuration.

Targets the CareerOneStop scholarship finder sponsored by the
U.S. Department of Labor. Contains 9500+ scholarships. Returns
403 on direct access, requiring scrapling method. ASP.NET form-based
search with server-rendered results.
"""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseAggregatorConfig


@dataclass
class Config(BaseAggregatorConfig):
    """CareerOneStop Scholarships aggregator config."""

    name: str = "CareerOneStop Scholarships"
    url: str = "https://www.careeronestop.org/Toolkit/Training/find-scholarships.aspx"
    source_id: str = "careeronestop_scholarships"
    primary_method: str = "scrapling"
    secondary_method: str | None = None
    selectors: dict[str, str] = field(default_factory=lambda: {
        "listing": ".scholarship-result, .result-item, tr, .card, .listing-item",
        "title": "h2 a::text, h3 a::text, .title::text, td a::text",
        "detail_link": "h2 a::attr(href), h3 a::attr(href), td a::attr(href)",
        "amount": ".amount::text, .award::text, td:nth-child(2)::text",
        "deadline": ".deadline::text, td:nth-child(3)::text",
        "description": "p::text, .description::text, .summary::text",
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
    detail_page: bool = True
    detail_selectors: dict[str, str] | None = field(default_factory=lambda: {
        "description": ".content p::text, article p::text, .details p::text",
        "eligibility": ".eligibility::text, .requirements li::text",
        "application_url": "a.apply::attr(href), a[href*='apply']::attr(href)",
    })
    rate_limit_delay: float = 3.0


CONFIG = Config()
