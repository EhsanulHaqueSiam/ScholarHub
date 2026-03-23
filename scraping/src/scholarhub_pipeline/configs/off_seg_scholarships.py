"""SEG Scholarships source configuration.

Targets the Society of Exploration Geophysicists scholarship page.
Scholarships range from $500-$10,000/year with March 1 deadline,
open to students worldwide. Site uses bot protection requiring scrapling.
URL: https://seg.org/programs/student-programs/scholarships/
"""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseOfficialConfig


@dataclass
class Config(BaseOfficialConfig):
    """SEG Scholarships official program config."""

    name: str = "SEG Scholarships"
    url: str = "https://seg.org/programs/student-programs/scholarships/"
    source_id: str = "seg_scholarships"
    primary_method: str = "scrapling"
    secondary_method: str | None = None
    selectors: dict[str, str] = field(default_factory=lambda: {
        "listing": "article, .content, main",
        "title": "h1::text, h2::text",
        "description": "article p::text, .content p::text",
        "host_country_default": "Global",
    })
    field_mappings: dict[str, str] = field(default_factory=lambda: {
        "title": "title",
        "description": "description",
    })
    pagination: dict | None = None
    detail_page: bool = False
    detail_selectors: dict[str, str] | None = None
    rate_limit_delay: float = 5.0


CONFIG = Config()
