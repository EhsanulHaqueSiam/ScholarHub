"""StudentScholarships.org source configuration."""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseAggregatorConfig


@dataclass
class Config(BaseAggregatorConfig):
    """StudentScholarships.org aggregator config.

    Server-rendered HTML with minimal JS. No structured CSS classes on cards.
    Scholarship entries use plain divs with <a> title links and text for
    amount/deadline. URL pattern: /scholarship/[ID]/[slug].
    AJAX endpoint for auth UI only, not scholarship data.
    """

    name: str = "StudentScholarships.org"
    url: str = "https://www.studentscholarships.org/scholarships"
    source_id: str = "studentscholarships"
    primary_method: str = "scrape"
    secondary_method: str | None = "scrapling"
    rate_limit_delay: float = 3.0
    selectors: dict[str, str] = field(default_factory=lambda: {
        "listing": "div > a[href*='/scholarship/'], article, .scholarship-entry",
        "title": "a[href*='/scholarship/']::text",
        "amount": "strong::text, b::text",
        "deadline": "strong::text, b::text",
        "detail_link": "a[href*='/scholarship/']::attr(href)",
        "next_page": "a[rel='next']::attr(href), .pagination .next::attr(href)",
    })
    field_mappings: dict[str, str] = field(default_factory=lambda: {
        "title": "title",
        "amount": "award_amount",
        "deadline": "application_deadline",
        "detail_link": "source_url",
    })
    pagination: dict | None = field(default_factory=lambda: {
        "type": "url",
        "selector": "a[rel='next']::attr(href), .pagination .next::attr(href)",
        "max_pages": 30,
    })
    detail_page: bool = True
    detail_selectors: dict[str, str] | None = field(default_factory=lambda: {
        "description": "p::text, .content p::text, .description::text",
        "eligibility": ".eligibility::text, .requirements::text",
        "application_url": "a[href*='apply']::attr(href), a.btn::attr(href)",
    })


CONFIG = Config()
