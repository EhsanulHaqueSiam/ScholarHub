"""DAAD Scholarships source configuration.

DAAD's scholarships overview page describes the German Academic Exchange
Service scholarship programmes. The overview page has substantive content
about DAAD's funding opportunities for international students including
study, research, and language learning in Germany.

URL: https://www.daad.de/en/studying-in-germany/scholarships/daad-scholarships/
"""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseOfficialConfig


@dataclass
class Config(BaseOfficialConfig):
    """DAAD Scholarships official program config.

    The DAAD-Scholarships overview page uses a Bootstrap-based layout
    with .s-wysiwyg content blocks containing rich descriptions of
    scholarship programmes. We extract a single record from the main
    content area.
    """

    name: str = "DAAD Scholarships"
    url: str = "https://www.daad.de/en/studying-in-germany/scholarships/daad-scholarships/"
    source_id: str = "daad_scholarships"
    primary_method: str = "scrape"
    secondary_method: str | None = "scrapling"
    selectors: dict[str, str] = field(
        default_factory=lambda: {
            "listing": "main",
            "title": "h1",
            "description": ".s-wysiwyg p",
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
