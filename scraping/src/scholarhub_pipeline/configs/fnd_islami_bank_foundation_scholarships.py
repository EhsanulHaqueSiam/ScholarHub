"""Islami Bank Foundation Scholarships source configuration.

Targets the Islami Bank Foundation (IBF) Bangladesh scholarship
programme pages. IBF runs education programmes including scholarships
for Bangladeshi students. Uses scrapling due to JS-heavy Bootstrap
site with dynamic content rendering.
"""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseFoundationConfig


@dataclass
class Config(BaseFoundationConfig):
    """Islami Bank Foundation Scholarships foundation config."""

    name: str = "Islami Bank Foundation Scholarships"
    url: str = "https://ibfbd.org"
    source_id: str = "islami_bank_foundation_scholarships"
    primary_method: str = "scrapling"
    secondary_method: str | None = None
    selectors: dict[str, str] = field(default_factory=lambda: {
        "listing": "article, .card, .service-item, section, .content-block",
        "title": "h2::text, h3::text, .card-title::text, a::text",
        "detail_link": "h2 a::attr(href), h3 a::attr(href), .card a::attr(href)",
        "description": "p::text, .card-body p::text, .content p::text",
        "host_country_default": "Bangladesh",
    })
    field_mappings: dict[str, str] = field(default_factory=lambda: {
        "title": "title",
        "detail_link": "source_url",
        "description": "description",
    })
    pagination: dict | None = None
    detail_page: bool = True
    detail_selectors: dict[str, str] | None = field(default_factory=lambda: {
        "description": ".content p::text, article p::text, .card-body p::text",
        "eligibility": ".eligibility::text, ul li::text",
    })
    rate_limit_delay: float = 4.0


CONFIG = Config()
