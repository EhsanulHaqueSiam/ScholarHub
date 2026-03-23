"""University of Auckland Scholarships source configuration.

Targets the University of Auckland find-a-scholarship page. Multi-record
listing with server-rendered HTML links to individual scholarship detail
pages. Detail pages have structured info including value and closing date.
URL: https://www.auckland.ac.nz/en/study/scholarships-and-awards/find-a-scholarship.html
"""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseOfficialConfig


@dataclass
class Config(BaseOfficialConfig):
    """University of Auckland Scholarships config."""

    name: str = "University of Auckland Scholarships"
    url: str = "https://www.auckland.ac.nz/en/study/scholarships-and-awards/find-a-scholarship.html"
    source_id: str = "nz_auckland_scholarships"
    primary_method: str = "scrape"
    secondary_method: str | None = "scrapling"
    selectors: dict[str, str] = field(default_factory=lambda: {
        "listing": "a[href*=\"find-a-scholarship/\"]",
        "title": "a::text",
        "detail_link": "a::attr(href)",
        "host_country_default": "New Zealand",
    })
    field_mappings: dict[str, str] = field(default_factory=lambda: {
        "title": "title",
        "detail_link": "source_url",
    })
    pagination: dict | None = None
    detail_page: bool = True
    detail_selectors: dict[str, str] | None = field(default_factory=lambda: {
        "title": "h1::text",
        "description": "#main-content p::text",
        "amount": ".definition-list dt:contains('Value') + dd::text",
        "deadline": ".definition-list dt:contains('Closing date') + dd::text",
    })
    rate_limit_delay: float = 3.0


CONFIG = Config()
