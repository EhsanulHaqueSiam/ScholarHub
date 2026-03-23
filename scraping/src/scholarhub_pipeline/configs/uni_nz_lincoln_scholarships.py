"""Lincoln University Scholarships source configuration.

Targets the Lincoln University scholarship search page. Multi-record
listing behind Cloudflare challenge protection, requiring scrapling
for reliable access. Silverstripe CMS-based.
URL: https://www.lincoln.ac.nz/study/scholarships/search-scholarships/
"""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseOfficialConfig


@dataclass
class Config(BaseOfficialConfig):
    """Lincoln University Scholarships config."""

    name: str = "Lincoln University Scholarships"
    url: str = "https://www.lincoln.ac.nz/study/scholarships/search-scholarships/"
    source_id: str = "nz_lincoln_scholarships"
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
