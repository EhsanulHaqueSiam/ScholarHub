"""Stipendium Hungaricum (Hungary) source configuration.

Targets the Stipendium Hungaricum application portal at
apply.stipendiumhungaricum.hu/courses which lists 1100+ study programmes
available under the Hungarian government scholarship. The site runs on the
DreamApply platform with URL parameter filtering and paginated results.
Programmes include bachelor, master, doctoral, and preparatory courses
at 30+ Hungarian universities.
"""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseGovernmentConfig


@dataclass
class Config(BaseGovernmentConfig):
    """Stipendium Hungaricum Courses government config."""

    name: str = "Stipendium Hungaricum Courses"
    url: str = "https://apply.stipendiumhungaricum.hu/courses?l%5B%5D=English&page=1"
    source_id: str = "stipendium_hungaricum_courses"
    primary_method: str = "scrape"
    secondary_method: str | None = "scrapling"
    selectors: dict[str, str] = field(default_factory=lambda: {
        "listing": ".course-item, .programme-card, .search-result, .card, article, .list-group-item, tr.programme-row",
        "title": "h3 a::text, h4 a::text, .course-title::text, .programme-name::text, .card-title::text",
        "university": ".university::text, .institution::text, .provider::text, .school-name::text",
        "degree_level": ".degree::text, .level::text, .programme-type::text, .badge::text",
        "detail_link": "h3 a::attr(href), h4 a::attr(href), .course-title a::attr(href), a.programme-link::attr(href)",
        "next_page": "a.next::attr(href), .pagination .next a::attr(href), li.next a::attr(href), a[rel='next']::attr(href)",
        "host_country_default": "Hungary",
    })
    field_mappings: dict[str, str] = field(default_factory=lambda: {
        "title": "title",
        "university": "provider_organization",
        "degree_level": "degree_level",
        "detail_link": "source_url",
        "description": "description",
        "duration": "funding_details",
        "language": "eligibility_criteria",
    })
    pagination: dict | None = field(default_factory=lambda: {
        "type": "page_num",
        "selector": "a.next::attr(href), .pagination .next a::attr(href), a[rel='next']::attr(href)",
        "max_pages": 60,
    })
    detail_page: bool = True
    detail_selectors: dict[str, str] | None = field(default_factory=lambda: {
        "description": ".course-description::text, .programme-info p::text, .detail-content p::text",
        "duration": ".duration::text, .length::text, .programme-duration::text",
        "language": ".language::text, .teaching-language::text",
    })
    rate_limit_delay: float = 3.0


CONFIG = Config()
