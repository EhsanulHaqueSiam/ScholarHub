"""JPSS (Japan Study Support) Scholarships source configuration.

Targets jpss.jp scholarship listing at https://www.jpss.jp/en/scholarship/
which lists ~140 scholarships across paginated HTML pages. Detail pages
at /en/scholarship/{id}/ contain stipend, duration, academic level,
nationality, and application period information.
"""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseGovernmentConfig


@dataclass
class Config(BaseGovernmentConfig):
    """JPSS Scholarships government config."""

    name: str = "JPSS Scholarships"
    url: str = "https://www.jpss.jp/en/scholarship/"
    source_id: str = "jpss_scholarships"
    primary_method: str = "scrapling"
    secondary_method: str | None = "scrape"
    selectors: dict[str, str] = field(default_factory=lambda: {
        "listing": "div.sch_list_area table tbody tr, div.scholarship-list .item, .search-result-item, table.sch_list tr",
        "title": "td:nth-child(1) a::text, .sch_name a::text, .name a::text",
        "provider": "td:nth-child(2)::text, .org_name::text, .organization::text",
        "detail_link": "td:nth-child(1) a::attr(href), .sch_name a::attr(href), .name a::attr(href)",
        "next_page": "a.next::attr(href), .pager a.next::attr(href), nav.pagination a[rel='next']::attr(href)",
        "host_country_default": "Japan",
    })
    field_mappings: dict[str, str] = field(default_factory=lambda: {
        "title": "title",
        "provider": "provider_organization",
        "detail_link": "source_url",
        "stipend": "award_amount",
        "duration": "funding_details",
        "academic_level": "degree_level",
        "nationality": "eligibility_criteria",
        "application_period": "application_deadline",
        "description": "description",
    })
    pagination: dict | None = field(default_factory=lambda: {
        "type": "url",
        "selector": "a.next::attr(href), .pager a.next::attr(href), nav.pagination a[rel='next']::attr(href)",
        "max_pages": 20,
    })
    detail_page: bool = True
    detail_selectors: dict[str, str] | None = field(default_factory=lambda: {
        "stipend": ".detail-item:contains('Monthly') dd::text, .stipend::text, td:contains('Stipend') + td::text",
        "duration": ".detail-item:contains('Period') dd::text, .duration::text, td:contains('Period') + td::text",
        "academic_level": ".detail-item:contains('Academic') dd::text, .level::text, td:contains('Degree') + td::text",
        "nationality": ".detail-item:contains('Nationality') dd::text, .nationality::text, td:contains('Nationality') + td::text",
        "application_period": ".detail-item:contains('Application') dd::text, .period::text, td:contains('Application') + td::text",
        "description": ".detail-description::text, .scholarship-detail .description::text, .overview::text",
    })
    rate_limit_delay: float = 3.0


CONFIG = Config()
