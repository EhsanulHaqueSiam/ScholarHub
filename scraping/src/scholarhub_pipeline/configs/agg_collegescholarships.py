"""CollegeScholarships.org source configuration."""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseAggregatorConfig


@dataclass
class Config(BaseAggregatorConfig):
    """CollegeScholarships.org aggregator config.

    Server-rendered HTML. Scholarship items with h4 > a title links.
    Award/Deadline in <strong> tags. URL-based pagination with ?page=N.
    ~769 pages of scholarship listings.
    URL pattern: /financial-aid/scholarship/[slug].
    """

    name: str = "CollegeScholarships.org"
    url: str = "https://www.collegescholarships.org/financial-aid"
    source_id: str = "collegescholarships"
    primary_method: str = "scrape"
    secondary_method: str | None = "scrapling"
    rate_limit_delay: float = 3.0
    selectors: dict[str, str] = field(default_factory=lambda: {
        "listing": "h4:has(a[href*='/financial-aid/']), article, .scholarship-item",
        "title": "h4 a::text, h4 > a::text",
        "amount": "strong::text",
        "deadline": "strong::text",
        "detail_link": "h4 a::attr(href), h4 > a::attr(href)",
        "next_page": "a[href*='page=']::attr(href), .pagination .next::attr(href)",
    })
    field_mappings: dict[str, str] = field(default_factory=lambda: {
        "title": "title",
        "amount": "award_amount",
        "deadline": "application_deadline",
        "detail_link": "source_url",
    })
    pagination: dict | None = field(default_factory=lambda: {
        "type": "page_num",
        "selector": "a[href*='page=']::attr(href), .pagination .next::attr(href)",
        "max_pages": 100,
    })
    detail_page: bool = True
    detail_selectors: dict[str, str] | None = field(default_factory=lambda: {
        "description": "p::text, .content p::text, .description::text",
        "eligibility": "li::text, .eligibility::text, .requirements::text",
        "application_url": "a[href*='apply']::attr(href), a.btn::attr(href)",
    })


CONFIG = Config()
