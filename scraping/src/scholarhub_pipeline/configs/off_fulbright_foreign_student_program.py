"""Fulbright Foreign Student Program source configuration.

The Fulbright Foreign Student Program about page describes the programme
for graduate students, young professionals, and artists from abroad to
study and conduct research in the United States. Administered by IIE
and funded by the U.S. Department of State.

URL: https://foreign.fulbrightonline.org/about/foreign-student-program
"""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseOfficialConfig


@dataclass
class Config(BaseOfficialConfig):
    """Fulbright Foreign Student Program official program config.

    The about page uses a ._ft-content wrapper with an h1 title and
    paragraphs describing the programme, placement models, and
    administration structure. We extract a single record.
    """

    name: str = "Fulbright Foreign Student Program"
    url: str = "https://foreign.fulbrightonline.org/about/foreign-student-program"
    source_id: str = "fulbright_foreign_student_program"
    primary_method: str = "scrape"
    secondary_method: str | None = "scrapling"
    selectors: dict[str, str] = field(
        default_factory=lambda: {
            "listing": "._ft-content",
            "title": "h1",
            "description": "p + p",
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
