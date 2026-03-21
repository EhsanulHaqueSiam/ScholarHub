"""Joint Japan World Bank Graduate Scholarship source configuration.

The World Bank scholarships landing page uses a layout with lp__
prefixed containers. Programme sections contain images, h2 headings,
descriptive text, and links to detail pages at /en/programs/scholarships/*.
Sections are separated by horizontal rules.

URL: https://www.worldbank.org/en/programs/scholarships
"""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseOfficialConfig


@dataclass
class Config(BaseOfficialConfig):
    """Joint Japan World Bank Graduate Scholarship official program config.

    Landing page with lp__ prefixed layout containers. We use the
    a[href*='/scholarships/'] links as listing items since each
    programme section contains a link to its detail page.
    """

    name: str = "Joint Japan World Bank Graduate Scholarship"
    url: str = "https://www.worldbank.org/en/programs/scholarships"
    source_id: str = "joint_japan_world_bank_graduate_scholarship"
    primary_method: str = "scrape"
    secondary_method: str | None = "scrapling"
    rate_limit_delay: float = 3.0
    selectors: dict[str, str] = field(
        default_factory=lambda: {
            "listing": "[class*='lp__slide']",
            "title": "h2",
            "description": "p",
            "detail_link": "a[href*='/scholarships/']::attr(href)",
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
            "description": "[class*='lp__'] p",
            "eligibility": "ul li",
            "application_url": "a[href*='apply']::attr(href)",
        }
    )


CONFIG = Config()
