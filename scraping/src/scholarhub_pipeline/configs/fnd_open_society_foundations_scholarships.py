"""Open Society Foundations Scholarships source configuration.

The OSF grants page lists fellowships/grants as clickable anchor tags
within list items. Each grant links to /grants/[slug] and contains
a title heading, description paragraph, and deadline status text.
Currently shows ~2 active grants (Leadership in Government Fellowship,
Open Society Fellowship).

URL: https://www.opensocietyfoundations.org/grants
"""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseFoundationConfig


@dataclass
class Config(BaseFoundationConfig):
    """Open Society Foundations Scholarships foundation config.

    Grant listing page with li > a structure. Each anchor wraps
    the grant card with title (h3), description, and deadline text.
    Detail pages at /grants/[slug] contain full programme info.
    """

    name: str = "Open Society Foundations Scholarships"
    url: str = "https://www.opensocietyfoundations.org/grants"
    source_id: str = "open_society_foundations_scholarships"
    primary_method: str = "scrape"
    secondary_method: str | None = "scrapling"
    rate_limit_delay: float = 3.0
    selectors: dict[str, str] = field(
        default_factory=lambda: {
            "listing": "li a[href*='/grants/']",
            "title": "h3",
            "description": "p",
            "detail_link": "::attr(href)",
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
            "description": "article p",
            "eligibility": "ul li",
            "application_url": "a[href*='apply']::attr(href)",
        }
    )


CONFIG = Config()
