"""Aga Khan Foundation International Scholarship source configuration.

AKDN uses a Next.js site with ContentFeatureBlockSimple components.
Content organized with h2/h3 sections (Overview, Eligibility Criteria,
Application Process, Award Conditions). Redirects from akdn.org to the.akdn.

URL: https://the.akdn/our-agencies/aga-khan-foundation/international-scholarship-programme
"""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseFoundationConfig


@dataclass
class Config(BaseFoundationConfig):
    """Aga Khan Foundation International Scholarship foundation config.

    Next.js site. ContentFeatureBlockSimple components with wysiwyg
    content, h3 section headings, and ul/li criteria lists.
    """

    name: str = "Aga Khan Foundation International Scholarship"
    url: str = "https://the.akdn/our-agencies/aga-khan-foundation/international-scholarship-programme"
    source_id: str = "aga_khan_foundation_international_scholarship"
    primary_method: str = "scrape"
    secondary_method: str | None = "scrapling"
    rate_limit_delay: float = 3.0
    selectors: dict[str, str] = field(
        default_factory=lambda: {
            "listing": "[class*='ContentFeatureBlock'], main, article",
            "title": "h2::text, .standardPageTitle::text",
            "description": "[class*='wysiwyg'] p::text, main p::text",
            "eligibility": "[class*='wysiwyg'] ul li::text, main ul li::text",
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
    detail_page: bool = False
    detail_selectors: dict[str, str] | None = None


CONFIG = Config()
