"""Stipendium Hungaricum (Hungary) source configuration.

Targets the Stipendium Hungaricum application portal at
apply.stipendiumhungaricum.hu/courses which lists 1100+ study programmes.
The site runs on the DreamApply platform using Semantic UI framework.
Course cards use .ui.card structure with .content > .header for titles.
Requires StealthyFetcher for JS rendering.

URL: https://apply.stipendiumhungaricum.hu/courses?l%5B%5D=English
"""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseGovernmentConfig


@dataclass
class Config(BaseGovernmentConfig):
    """Stipendium Hungaricum Courses government config.

    DreamApply platform with Semantic UI framework. Course listings
    render as .ui.card elements with .content > .header (title),
    .meta (university/level), and .description (course details).
    Needs StealthyFetcher for JS rendering.
    """

    name: str = "Stipendium Hungaricum Courses"
    url: str = "https://apply.stipendiumhungaricum.hu/courses?l%5B%5D=English"
    source_id: str = "stipendium_hungaricum_courses"
    primary_method: str = "scrapling"
    secondary_method: str | None = None
    selectors: dict[str, str] = field(default_factory=lambda: {
        "listing": "div.result.segment",
        "title": ".seven.wide.column a[href*='/courses/course/']",
        "university": ".four.wide.column a",
        "degree_level": "span.label",
        "detail_link": "a[href*='/courses/course/']::attr(href)",
        "host_country_default": "Hungary",
    })
    field_mappings: dict[str, str] = field(default_factory=lambda: {
        "title": "title",
        "university": "provider_organization",
        "degree_level": "degree_level",
        "detail_link": "source_url",
    })
    pagination: dict | None = field(default_factory=lambda: {
        "type": "page_num",
        "param": "page",
        "start": 1,
        "max_pages": 60,
    })
    detail_page: bool = False
    detail_selectors: dict[str, str] | None = None
    rate_limit_delay: float = 3.0


CONFIG = Config()
