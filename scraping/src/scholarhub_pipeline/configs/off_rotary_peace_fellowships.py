"""Rotary Peace Fellowships source configuration.

The peace-fellowships page is an informational Drupal page with two
programme options under "Choose the program that's right for you":
Master's degree programs and Professional development certificate.
Each programme is presented as an h3 section with descriptive
paragraphs and a "Learn more" link.

URL: https://www.rotary.org/en/our-programs/peace-fellowships
"""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseOfficialConfig


@dataclass
class Config(BaseOfficialConfig):
    """Rotary Peace Fellowships official program config.

    Drupal site with h2/h3 heading hierarchy. The page is a single
    informational page; we extract the whole page as one record
    using #main as the listing container and pull the page title,
    first description paragraph, and the first link.
    """

    name: str = "Rotary Peace Fellowships"
    url: str = "https://www.rotary.org/en/our-programs/peace-fellowships"
    source_id: str = "rotary_peace_fellowships"
    primary_method: str = "scrape"
    secondary_method: str | None = "scrapling"
    rate_limit_delay: float = 3.0
    selectors: dict[str, str] = field(
        default_factory=lambda: {
            "listing": "#main",
            "title": "h1",
            "description": "h2",
        }
    )
    field_mappings: dict[str, str] = field(
        default_factory=lambda: {
            "title": "title",
            "description": "description",
        }
    )
    pagination: dict | None = None
    detail_page: bool = False
    detail_selectors: dict[str, str] | None = None


CONFIG = Config()
