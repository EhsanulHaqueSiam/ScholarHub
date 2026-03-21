"""Ireland Government International Education Scholarships configuration.

Targets the Government of Ireland international education scholarship
programme administered by the HEA. Uses scrapling due to the gov.ie
platform's dynamic content loading.
"""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseGovernmentConfig


@dataclass
class Config(BaseGovernmentConfig):
    """Ireland Government Scholarships government config."""

    name: str = "Ireland Government Scholarships"
    url: str = "https://www.gov.ie/en/policy-information/education-scholarships/"
    source_id: str = "ireland_government_scholarships"
    primary_method: str = "scrapling"
    secondary_method: str | None = None
    selectors: dict[str, str] = field(default_factory=lambda: {
        "listing": "article, .reboot-content section, .publication-card, .card, .content-item",
        "title": "h1::text, h2::text, h3::text, .card-title::text",
        "detail_link": "h2 a::attr(href), h3 a::attr(href), a::attr(href)",
        "description": "p::text, .summary::text, .card-body p::text",
        "host_country_default": "Ireland",
    })
    field_mappings: dict[str, str] = field(default_factory=lambda: {
        "title": "title",
        "detail_link": "source_url",
        "description": "description",
    })
    pagination: dict | None = None
    detail_page: bool = True
    detail_selectors: dict[str, str] | None = field(default_factory=lambda: {
        "description": ".reboot-content p::text, article p::text, .content p::text",
        "eligibility": ".eligibility p::text, ul li::text",
        "deadline": ".deadline::text, .date::text",
    })
    rate_limit_delay: float = 5.0


CONFIG = Config()
