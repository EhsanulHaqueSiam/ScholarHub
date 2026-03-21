"""Swiss Government Excellence Scholarships source configuration.

The SBFI scholarships page uses a .teaser-submenu-container with
.teaser-item cards. Each card has a title, description, slug (link),
and publication date. Two main scholarship entries are listed as
highlight teasers. Uses .container/.section layout classes.

URL: https://www.sbfi.admin.ch/sbfi/en/home/education/scholarships-and-grants.html
"""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseOfficialConfig


@dataclass
class Config(BaseOfficialConfig):
    """Swiss Government Excellence Scholarships official program config.

    .teaser-item cards inside .teaser-submenu-container. Each card has
    title heading, description, and link. Role=main for content area.
    """

    name: str = "Swiss Government Excellence Scholarships"
    url: str = "https://www.sbfi.admin.ch/sbfi/en/home/education/scholarships-and-grants.html"
    source_id: str = "swiss_government_excellence_scholarships"
    primary_method: str = "scrape"
    secondary_method: str | None = "scrapling"
    rate_limit_delay: float = 3.0
    selectors: dict[str, str] = field(
        default_factory=lambda: {
            "listing": ".teaser-item, .teaser-submenu-container article, main section",
            "title": "h1::text, h3::text, .hero__title::text",
            "description": ".teaser-item p::text, main p::text, .section p::text",
            "detail_link": ".teaser-item a::attr(href), a::attr(href)",
            "host_country_default": "Switzerland",
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
            "description": "main p::text, article p::text, .section p::text",
            "eligibility": "ul li::text, ol li::text",
            "application_url": "a[href*='apply']::attr(href), a[href*='scholarship']::attr(href)",
        }
    )


CONFIG = Config()
