"""Mastercard Foundation Scholars Program source configuration.

The Mastercard Foundation scholars page uses Flickity carousel for images,
statistics display sections, and card-based impact story links. Partner
universities are referenced via navigation links. The page focuses on
Africa-focused education and leadership development.

URL: https://mastercardfdn.org/all/scholars/becoming-a-scholar/
"""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseFoundationConfig


@dataclass
class Config(BaseFoundationConfig):
    """Mastercard Foundation Scholars Program foundation config.

    Uses Flickity carousel, scholar testimonials, statistics,
    and card-based impact stories. Partner details in sub-pages.
    """

    name: str = "Mastercard Foundation Scholars Program"
    url: str = "https://mastercardfdn.org/all/scholars/becoming-a-scholar/"
    source_id: str = "mastercard_foundation_scholars_program_fnd"
    primary_method: str = "scrape"
    secondary_method: str | None = "scrapling"
    rate_limit_delay: float = 3.0
    selectors: dict[str, str] = field(
        default_factory=lambda: {
            "listing": "#main-content, article, main",
            "title": "h1::text, h2::text",
            "description": "main p::text, article p::text",
            "eligibility": "main ul li::text, article ul li::text",
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
