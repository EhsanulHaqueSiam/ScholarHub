"""Open Society Foundations Scholarships source configuration.

The OSF grants page lists fellowships/grants as li items within a ul.
Each entry is a linked li containing title, category label (Fellowship),
description, and deadline status. Supports URL filter parameters
(filter_region, filter_type, sort_by) for dynamic content.

URL: https://www.opensocietyfoundations.org/grants
"""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseFoundationConfig


@dataclass
class Config(BaseFoundationConfig):
    """Open Society Foundations Scholarships foundation config.

    Grant listing as ul > li with linked entries. Each li has
    title, type badge, description, and deadline. Filterable via
    URL query params.
    """

    name: str = "Open Society Foundations Scholarships"
    url: str = "https://www.opensocietyfoundations.org/grants"
    source_id: str = "open_society_foundations_scholarships"
    primary_method: str = "scrape"
    secondary_method: str | None = "scrapling"
    rate_limit_delay: float = 3.0
    selectors: dict[str, str] = field(
        default_factory=lambda: {
            "listing": "#main ul li, main ul li",
            "title": "h2::text, h3::text, a::text",
            "description": "li p::text, li span::text",
            "deadline": "li::text",
            "detail_link": "li a::attr(href)",
            "host_country_default": "",
        }
    )
    field_mappings: dict[str, str] = field(
        default_factory=lambda: {
            "title": "title",
            "description": "description",
            "deadline": "application_deadline",
            "detail_link": "source_url",
        }
    )
    pagination: dict | None = None
    detail_page: bool = True
    detail_selectors: dict[str, str] | None = field(
        default_factory=lambda: {
            "description": "article p::text, main p::text",
            "eligibility": "ul li::text, ol li::text",
            "application_url": "a[href*='apply']::attr(href), a.btn::attr(href)",
        }
    )


CONFIG = Config()
