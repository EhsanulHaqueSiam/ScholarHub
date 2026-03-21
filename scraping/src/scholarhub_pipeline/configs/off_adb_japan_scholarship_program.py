"""ADB Japan Scholarship Program source configuration.

The ADB-JSP page uses Drupal with Bootstrap grid. Content is organized
with h1 title, h2 sections (Find Your Field, What We Offer, Eligibility
and Application), h3 subsections, and ul/ol lists for benefits and criteria.

URL: https://www.adb.org/work-with-us/careers/japan-scholarship-program
"""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseOfficialConfig


@dataclass
class Config(BaseOfficialConfig):
    """ADB Japan Scholarship Program official program config.

    Drupal-based page with .field containers, h2+ul/ol pairs for
    structured data. Tabbed navigation for sub-pages.
    """

    name: str = "ADB Japan Scholarship Program"
    url: str = "https://www.adb.org/work-with-us/careers/japan-scholarship-program"
    source_id: str = "adb_japan_scholarship_program"
    primary_method: str = "scrape"
    secondary_method: str | None = "scrapling"
    rate_limit_delay: float = 3.0
    selectors: dict[str, str] = field(
        default_factory=lambda: {
            "listing": ".node, .field, main, article",
            "title": "h1::text",
            "description": ".field p::text, main p::text",
            "eligibility": "ul li::text, ol li::text",
            "amount": "h2 + ul li::text, h2 + p::text",
            "detail_link": "a::attr(href)",
            "host_country_default": "",
        }
    )
    field_mappings: dict[str, str] = field(
        default_factory=lambda: {
            "title": "title",
            "description": "description",
            "detail_link": "source_url",
            "eligibility": "eligibility_criteria",
            "amount": "award_amount",
        }
    )
    pagination: dict | None = None
    detail_page: bool = False
    detail_selectors: dict[str, str] | None = None


CONFIG = Config()
