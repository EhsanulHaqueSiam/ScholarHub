"""University of Waikato Scholarships source configuration.

Targets the University of Waikato find-a-scholarship page. Multi-record
listing with JS filtering using URL-encoded JSON parameters, requiring
scrapling for dynamic content rendering.
URL: https://www.waikato.ac.nz/scholarships/find-a-scholarship/
"""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseOfficialConfig


@dataclass
class Config(BaseOfficialConfig):
    """University of Waikato Scholarships config."""

    name: str = "University of Waikato Scholarships"
    url: str = "https://www.waikato.ac.nz/scholarships/find-a-scholarship/"
    source_id: str = "nz_waikato_scholarships"
    primary_method: str = "scrapling"
    secondary_method: str | None = None
    selectors: dict[str, str] = field(default_factory=lambda: {
        "listing": ".scholarship-item, .card, article, .result-item",
        "title": "h2 a::text, h3 a::text, .card-title::text",
        "detail_link": "h2 a::attr(href), h3 a::attr(href), .card a::attr(href)",
        "description": "p::text, .summary::text",
        "host_country_default": "New Zealand",
    })
    field_mappings: dict[str, str] = field(default_factory=lambda: {
        "title": "title",
        "detail_link": "source_url",
        "description": "description",
    })
    pagination: dict | None = field(default_factory=lambda: {
        "type": "url",
        "selector": ".pagination .next::attr(href), a.next::attr(href)",
        "max_pages": 10,
    })
    detail_page: bool = True
    detail_selectors: dict[str, str] | None = field(default_factory=lambda: {
        "description": ".content p::text, article p::text",
        "eligibility": ".eligibility p::text, .requirements li::text",
        "deadline": ".deadline::text, .closing-date::text",
        "amount": ".amount::text, .value::text",
    })
    rate_limit_delay: float = 3.0


CONFIG = Config()
