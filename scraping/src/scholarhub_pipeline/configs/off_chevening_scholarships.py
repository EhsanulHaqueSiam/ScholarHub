"""Chevening Scholarships source configuration.

Chevening is a single-scholarship programme page. The scraper extracts one
record representing the Chevening Scholarship by using the main content
area as a single listing item and pulling structured information from
headings, paragraphs, and navigation links.

URL: https://www.chevening.org/scholarships/
"""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseOfficialConfig


@dataclass
class Config(BaseOfficialConfig):
    """Chevening Scholarships official program config.

    This is a single-programme site. The landing page at /scholarships/
    describes the Chevening Scholarship (fully-funded master's in the UK).
    We treat the page's main content block as a single listing item.
    """

    name: str = "Chevening Scholarships"
    url: str = "https://www.chevening.org/scholarships/"
    source_id: str = "chevening_scholarships"
    primary_method: str = "scrape"
    secondary_method: str | None = "scrapling"
    selectors: dict[str, str] = field(
        default_factory=lambda: {
            # Use the <main> element as a single listing item
            "listing": "main",
            "title": "h1",
            "description": "p",
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
