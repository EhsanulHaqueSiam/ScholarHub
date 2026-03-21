"""Mastercard Foundation Scholars Program (official listing) source configuration.

Hub page for the Mastercard Foundation Scholars Program. Lists programme
overview, impact statistics, and links to partner university pages.

URL: https://mastercardfdn.org/all/scholars/
"""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseOfficialConfig


@dataclass
class Config(BaseOfficialConfig):
    """Mastercard Foundation Scholars Program official program config.

    Hub page with carousel, impact stats, and partner links.
    Detail pages contain university-specific information.
    """

    name: str = "Mastercard Foundation Scholars Program"
    url: str = "https://mastercardfdn.org/all/scholars/"
    source_id: str = "mastercard_foundation_scholars_program"
    primary_method: str = "scrape"
    secondary_method: str | None = "scrapling"
    rate_limit_delay: float = 3.0
    selectors: dict[str, str] = field(
        default_factory=lambda: {
            "listing": "#main-content, article, main",
            "title": "h1::text, h2::text",
            "description": "main p::text, article p::text",
            "detail_link": "a::attr(href)",
            "host_country_default": "",
        }
    )
    field_mappings: dict[str, str] = field(
        default_factory=lambda: {
            "title": "title",
            "description": "description",
            "detail_link": "source_url",
        }
    )
    pagination: dict | None = None
    detail_page: bool = True
    detail_selectors: dict[str, str] | None = field(
        default_factory=lambda: {
            "description": "article p::text, main p::text",
            "eligibility": "ul li::text, ol li::text",
            "application_url": "a[href*='apply']::attr(href), a[href*='where-to-apply']::attr(href)",
        }
    )


CONFIG = Config()
