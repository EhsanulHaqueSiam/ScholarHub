"""Chevening Scholarships (UK) source configuration.

Targets the Chevening scholarship programme pages at chevening.org.
This is a single flagship programme (fully-funded UK master's degrees)
with static WordPress content. The main page and sub-pages contain
eligibility, benefits, timeline, and country-specific information.
"""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseGovernmentConfig


@dataclass
class Config(BaseGovernmentConfig):
    """Chevening Scholarship Programme government config."""

    name: str = "Chevening Scholarship Programme"
    url: str = "https://www.chevening.org/scholarships/"
    source_id: str = "chevening_scholarship_programme"
    primary_method: str = "scrape"
    secondary_method: str | None = "scrapling"
    selectors: dict[str, str] = field(default_factory=lambda: {
        "listing": "article, .entry-content, .content-section, .wp-block-group, section.section, .scholarship-type",
        "title": "h1::text, h2::text, .entry-title::text, .section-title::text",
        "description": ".entry-content p::text, .section-content p::text, .wp-block-paragraph::text, p::text",
        "detail_link": "a::attr(href)",
        "host_country_default": "United Kingdom",
    })
    field_mappings: dict[str, str] = field(default_factory=lambda: {
        "title": "title",
        "description": "description",
        "detail_link": "source_url",
        "eligibility": "eligibility_criteria",
        "benefits": "funding_details",
        "deadline": "application_deadline",
    })
    pagination: dict | None = None
    detail_page: bool = True
    detail_selectors: dict[str, str] | None = field(default_factory=lambda: {
        "description": ".entry-content p::text, .page-content p::text, article p::text",
        "eligibility": ".eligibility p::text, .requirements li::text, .entry-content ul li::text",
        "benefits": ".benefits p::text, .what-you-get li::text, .funding li::text",
        "deadline": ".deadline::text, .timeline .date::text, .dates p::text",
    })
    rate_limit_delay: float = 3.0


CONFIG = Config()
