"""Rotary Peace Fellowships source configuration.

Rotary scholarships page is a Drupal 7 site with #main/#page-content
containers. Organized into two main sections: seeking a scholarship and
offering a scholarship. h3 subsections for grant types (Global grant,
District grants, Rotary Peace Fellowships). Uses ol/ul lists.

URL: https://www.rotary.org/en/our-programs/scholarships
"""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseOfficialConfig


@dataclass
class Config(BaseOfficialConfig):
    """Rotary Peace Fellowships official program config.

    Drupal site with .node/.field containers. h2/h3 heading hierarchy
    with list-based content. No card components.
    """

    name: str = "Rotary Peace Fellowships"
    url: str = "https://www.rotary.org/en/our-programs/peace-fellowships"
    source_id: str = "rotary_peace_fellowships"
    primary_method: str = "scrape"
    secondary_method: str | None = "scrapling"
    rate_limit_delay: float = 3.0
    selectors: dict[str, str] = field(
        default_factory=lambda: {
            "listing": "#page-content, .node, main, article",
            "title": "h1::text",
            "description": "#page-content p::text, .node p::text, main p::text",
            "eligibility": "#page-content ul li::text, #page-content ol li::text",
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
