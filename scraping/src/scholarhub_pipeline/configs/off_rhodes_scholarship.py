"""Rhodes Scholarship source configuration.

The Rhodes Scholarship page at Rhodes House describes a fully-funded
postgraduate award at the University of Oxford. The page content uses
span elements (CMS-generated) for descriptive text and h1 for the title.
Annual stipend GBP 20,400 for 2025-26, covers tuition, flights, visa.

URL: https://www.rhodeshouse.ox.ac.uk/scholarships/the-rhodes-scholarship/
"""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseOfficialConfig


@dataclass
class Config(BaseOfficialConfig):
    """Rhodes Scholarship official program config.

    The detail page uses CMS-generated markup with content in span
    elements with MS Word-style classes. The h1 contains "The Rhodes
    Scholarship". We use body as the listing container and span
    for description since descriptive text is in span elements.
    """

    name: str = "Rhodes Scholarship"
    url: str = "https://www.rhodeshouse.ox.ac.uk/scholarships/the-rhodes-scholarship/"
    source_id: str = "rhodes_scholarship"
    primary_method: str = "scrape"
    secondary_method: str | None = "scrapling"
    selectors: dict[str, str] = field(
        default_factory=lambda: {
            "listing": "main",
            "title": "h1",
            "description": ".content span",
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
