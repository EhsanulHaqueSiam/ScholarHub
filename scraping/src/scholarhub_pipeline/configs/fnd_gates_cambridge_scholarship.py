"""Gates Cambridge Scholarship source configuration.

Gates Cambridge awards ~80 full-cost postgraduate scholarships annually
at the University of Cambridge. The programme page describes coverage
(fees, maintenance allowance of GBP 21,000/year, airfare, visa costs)
and selection criteria.

URL: https://www.gatescambridge.org/programme/the-scholarship/
"""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseFoundationConfig


@dataclass
class Config(BaseFoundationConfig):
    """Gates Cambridge Scholarship foundation config.

    The /programme/the-scholarship/ page has detailed content about
    the scholarship including funding components, selection criteria,
    and scholar demographics. Uses scrape method with main element
    as the single listing container.
    """

    name: str = "Gates Cambridge Scholarship"
    url: str = "https://www.gatescambridge.org/programme/the-scholarship/"
    source_id: str = "gates_cambridge_scholarship"
    primary_method: str = "scrape"
    secondary_method: str | None = "scrapling"
    selectors: dict[str, str] = field(
        default_factory=lambda: {
            "listing": "body",
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
