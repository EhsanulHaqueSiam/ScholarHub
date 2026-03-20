"""Commonwealth Scholarships source configuration.

Scrapes the CSC UK scholarships listing page which displays multiple
scholarship types (PhD, Master's, Fellowships, etc.) as article entries
in a grid layout.
"""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseOfficialConfig


@dataclass
class Config(BaseOfficialConfig):
    """Commonwealth Scholarships official program config.

    The listing page at cscuk.fcdo.gov.uk/scholarships/ uses a WordPress
    display-posts shortcode that renders scholarship types as linked entries
    with titles and short excerpts.
    """

    name: str = "Commonwealth Scholarships"
    url: str = "https://cscuk.fcdo.gov.uk/scholarships/"
    source_id: str = "commonwealth_scholarships"
    primary_method: str = "scrape"
    secondary_method: str | None = "scrapling"
    selectors: dict[str, str] = field(
        default_factory=lambda: {
            "listing": "article",
            "title": "h2 a",
            "description": "p",
            "detail_link": "h2 a::attr(href)",
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
            "description": ".entry-content p",
            "eligibility": ".entry-content ul",
        }
    )


CONFIG = Config()
