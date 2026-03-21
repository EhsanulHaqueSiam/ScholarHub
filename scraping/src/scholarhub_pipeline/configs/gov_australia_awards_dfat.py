"""Australia Awards (DFAT) source configuration.

Targets the Australian Department of Foreign Affairs and Trade
Australia Awards scholarship pages. The site has slow response times
and requires scrapling for reliable access.
"""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseGovernmentConfig


@dataclass
class Config(BaseGovernmentConfig):
    """Australia Awards (DFAT) government config."""

    name: str = "Australia Awards (DFAT)"
    url: str = "https://www.dfat.gov.au/people-to-people/australia-awards"
    source_id: str = "australia_awards_dfat"
    primary_method: str = "scrapling"
    secondary_method: str | None = None
    selectors: dict[str, str] = field(default_factory=lambda: {
        "listing": "article, .views-row, .listing-item, .content-item, section",
        "title": "h2::text, h3::text, .field-title::text, a::text",
        "detail_link": "h2 a::attr(href), h3 a::attr(href), a::attr(href)",
        "description": "p::text, .field-summary::text, .teaser::text",
        "host_country_default": "Australia",
    })
    field_mappings: dict[str, str] = field(default_factory=lambda: {
        "title": "title",
        "detail_link": "source_url",
        "description": "description",
    })
    pagination: dict | None = None
    detail_page: bool = True
    detail_selectors: dict[str, str] | None = field(default_factory=lambda: {
        "description": ".field-body p::text, article p::text, .content p::text",
        "eligibility": ".eligibility p::text, ul li::text",
        "deadline": ".deadline::text, .date::text",
    })
    rate_limit_delay: float = 5.0


CONFIG = Config()
