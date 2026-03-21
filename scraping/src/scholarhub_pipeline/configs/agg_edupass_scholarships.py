"""EduPASS Scholarships source configuration.

Targets the EduPASS financial aid pages for international students
studying in the USA. The site returns 405 on some paths, requiring
scrapling. Contains curated scholarship and financial aid listings.
"""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseAggregatorConfig


@dataclass
class Config(BaseAggregatorConfig):
    """EduPASS Scholarships aggregator config."""

    name: str = "EduPASS Scholarships"
    url: str = "https://www.edupass.org/finaid/scholarships.phtml"
    source_id: str = "edupass_scholarships"
    primary_method: str = "scrapling"
    secondary_method: str | None = None
    selectors: dict[str, str] = field(default_factory=lambda: {
        "listing": "article, .content-section, li, .listing-item, tr",
        "title": "h2::text, h3::text, a::text, strong::text",
        "detail_link": "a::attr(href), h2 a::attr(href), h3 a::attr(href)",
        "description": "p::text, .description::text, td::text",
        "host_country_default": "United States",
    })
    field_mappings: dict[str, str] = field(default_factory=lambda: {
        "title": "title",
        "detail_link": "source_url",
        "description": "description",
    })
    pagination: dict | None = None
    detail_page: bool = True
    detail_selectors: dict[str, str] | None = field(default_factory=lambda: {
        "description": ".content p::text, article p::text, td p::text",
        "eligibility": ".eligibility::text, ul li::text",
        "amount": ".amount::text, .value::text",
    })
    rate_limit_delay: float = 3.0


CONFIG = Config()
