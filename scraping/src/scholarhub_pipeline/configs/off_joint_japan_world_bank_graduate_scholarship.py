"""Joint Japan World Bank Graduate Scholarship source configuration.

The World Bank scholarships page lists multiple programmes as card/section
elements with images, linked headlines, and descriptive text. Key programmes
include JJ/WBGSP, Robert S. McNamara Fellowships. Cards link to detail pages.

URL: https://www.worldbank.org/en/programs/scholarships
"""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseOfficialConfig


@dataclass
class Config(BaseOfficialConfig):
    """Joint Japan World Bank Graduate Scholarship official program config.

    Card-based layout with lp__slide_ prefixed containers, background images,
    and linked headlines. Detail pages hold application info.
    """

    name: str = "Joint Japan World Bank Graduate Scholarship"
    url: str = "https://www.worldbank.org/en/programs/scholarships"
    source_id: str = "joint_japan_world_bank_graduate_scholarship"
    primary_method: str = "scrape"
    secondary_method: str | None = "scrapling"
    rate_limit_delay: float = 3.0
    selectors: dict[str, str] = field(
        default_factory=lambda: {
            "listing": "[class*='lp__slide'], .card, article, section",
            "title": "h1::text, h2::text, h3::text",
            "description": "p::text",
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
            "description": "article p::text, .content p::text, main p::text",
            "eligibility": "ul li::text, ol li::text",
            "application_url": "a[href*='apply']::attr(href), a.btn::attr(href)",
        }
    )


CONFIG = Config()
