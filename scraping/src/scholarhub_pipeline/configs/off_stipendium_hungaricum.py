"""Stipendium Hungaricum source configuration.

Stipendium Hungaricum is Hungary's government scholarship programme.
The about page contains detailed information about benefits, stipend
amounts (HUF 43,700-180,000/month depending on level), eligible
countries, and programme structure.

The page has no h1/h2 headings or main/article elements. Content is in
container--* sections with .col-12 columns. The intro section's first
column contains the core programme description.

URL: https://stipendiumhungaricum.hu/about/
"""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseOfficialConfig


@dataclass
class Config(BaseOfficialConfig):
    """Stipendium Hungaricum official program config.

    Uses .main-wrapper as the listing container with description
    from the intro section's first column which starts with
    "Stipendium Hungaricum, the Hungarian Government's most
    prestigious higher education scholarship programme..."
    """

    name: str = "Stipendium Hungaricum"
    url: str = "https://stipendiumhungaricum.hu/about/"
    source_id: str = "stipendium_hungaricum"
    primary_method: str = "scrape"
    secondary_method: str | None = "scrapling"
    selectors: dict[str, str] = field(
        default_factory=lambda: {
            "listing": ".main-wrapper",
            "title": ".container--mission p",
            "description": ".container--intro .col-12:first-child p",
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
