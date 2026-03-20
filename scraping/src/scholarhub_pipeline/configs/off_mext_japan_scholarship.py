"""MEXT Japan Scholarship source configuration.

The Study in Japan MEXT scholarships page describes 7 scholarship types
(Research Students, Teacher Training, Undergraduate, Japanese Studies,
College of Technology, Specialized Training, and YLP) with stipend
details and eligibility information. The page uses a comparison table
format where scholarship types are columns.

URL: https://www.studyinjapan.go.jp/en/planning/scholarships/mext-scholarships/
"""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseOfficialConfig


@dataclass
class Config(BaseOfficialConfig):
    """MEXT Japan Scholarship official program config.

    The MEXT page has:
    - h2: "Japanese Government (MEXT) Scholarship" (main title)
    - h3 subheadings for sections (Types, Eligibility, Examinations)
    - Table with 7 scholarship types and their stipend amounts
    - Paragraphs describing the programme
    We extract a single record using the main content area.
    """

    name: str = "MEXT Japan Scholarship"
    url: str = "https://www.studyinjapan.go.jp/en/planning/scholarships/mext-scholarships/"
    source_id: str = "mext_japan_scholarship"
    primary_method: str = "scrape"
    secondary_method: str | None = "scrapling"
    selectors: dict[str, str] = field(
        default_factory=lambda: {
            "listing": "main",
            "title": "h2",
            "description": ".details p",
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
