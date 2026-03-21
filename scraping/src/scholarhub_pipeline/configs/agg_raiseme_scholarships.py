"""RaiseMe Micro-Scholarships source configuration.

Targets the RaiseMe micro-scholarship platform. This is primarily
an app-based service where students earn micro-scholarships for
achievements. Public listings are limited; the platform requires
sign-up to access scholarship matching. Uses scrapling to extract
any publicly available scholarship information.
"""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseAggregatorConfig


@dataclass
class Config(BaseAggregatorConfig):
    """RaiseMe Micro-Scholarships aggregator config."""

    name: str = "RaiseMe Micro-Scholarships"
    url: str = "https://www.raise.me"
    source_id: str = "raiseme_scholarships"
    primary_method: str = "scrapling"
    secondary_method: str | None = None
    selectors: dict[str, str] = field(default_factory=lambda: {
        "listing": ".college-card, .card, article, .partner-item, .school-item",
        "title": "h2::text, h3::text, .card-title::text, .college-name::text",
        "detail_link": "h2 a::attr(href), h3 a::attr(href), .card a::attr(href)",
        "amount": ".amount::text, .earnings::text, .scholarship-amount::text",
        "description": "p::text, .card-body p::text, .testimonial::text",
        "host_country_default": "United States",
    })
    field_mappings: dict[str, str] = field(default_factory=lambda: {
        "title": "title",
        "detail_link": "source_url",
        "amount": "award_amount",
        "description": "description",
    })
    pagination: dict | None = None
    detail_page: bool = False
    auth_config: dict | None = field(default_factory=lambda: {
        "type": "registration",
        "note": "Free sign-up required to access scholarship matching",
    })
    rate_limit_delay: float = 3.0


CONFIG = Config()
