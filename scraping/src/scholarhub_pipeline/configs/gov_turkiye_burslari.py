"""Turkiye Burslari (Turkey Scholarships) source configuration.

Targets the Turkiye Burslari scholarship portal at turkiyeburslari.gov.tr
which is Turkey's flagship government scholarship programme. The site is
an ASP.NET application with static content pages covering undergraduate,
graduate, and research scholarship tracks with programme search functionality.
"""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseGovernmentConfig


@dataclass
class Config(BaseGovernmentConfig):
    """Turkiye Burslari Programme government config."""

    name: str = "Turkiye Burslari Programme"
    url: str = "https://www.turkiyeburslari.gov.tr/en/page/prospective-students/turkiye-scholarships"
    source_id: str = "turkiye_burslari_programme"
    primary_method: str = "scrape"
    secondary_method: str | None = "scrapling"
    selectors: dict[str, str] = field(default_factory=lambda: {
        "listing": ".programme-card, .scholarship-item, article, .content-block, section.section, .card",
        "title": "h2::text, h3::text, .card-title::text, .programme-title::text",
        "description": "p::text, .card-text::text, .description::text, .programme-desc::text",
        "detail_link": "a::attr(href), .card a::attr(href)",
        "host_country_default": "Turkey",
    })
    field_mappings: dict[str, str] = field(default_factory=lambda: {
        "title": "title",
        "description": "description",
        "detail_link": "source_url",
        "eligibility": "eligibility_criteria",
        "benefits": "funding_details",
        "level": "degree_level",
        "deadline": "application_deadline",
    })
    pagination: dict | None = None
    detail_page: bool = True
    detail_selectors: dict[str, str] | None = field(default_factory=lambda: {
        "description": ".page-content p::text, article p::text, .content-area p::text",
        "eligibility": ".eligibility p::text, .criteria li::text, .requirements li::text",
        "benefits": ".benefits li::text, .coverage li::text, .scholarship-benefits li::text",
        "level": ".education-level::text, .degree::text",
        "deadline": ".deadline::text, .application-period::text, .dates::text",
    })
    rate_limit_delay: float = 3.0


CONFIG = Config()
