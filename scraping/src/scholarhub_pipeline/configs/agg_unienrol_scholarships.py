"""UniEnrol Scholarships source configuration."""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseAggregatorConfig


@dataclass
class Config(BaseAggregatorConfig):
    """UniEnrol Scholarships aggregator config.

    Next.js app with client-side hydration. JSON-LD Schema.org data
    with MonetaryGrant items embedded in page. URL pattern:
    /scholarships/external/[nationality]/detail/[slug].
    Covers Asia, UK, AU, EU scholarships.
    """

    name: str = "UniEnrol Scholarships"
    url: str = "https://unienrol.com/scholarships"
    source_id: str = "unienrol_scholarships"
    primary_method: str = "scrapling"
    secondary_method: str | None = "scrape"
    rate_limit_delay: float = 3.0
    selectors: dict[str, str] = field(default_factory=lambda: {
        "listing": "[itemtype*='MonetaryGrant'], .scholarship-card, article, .listing-card",
        "title": "[itemprop='name']::text, h2 a::text, h3 a::text, .card-title::text",
        "funder": "[itemprop='funder'] [itemprop='name']::text, .organization::text",
        "amount": ".amount::text, .coverage::text, .award::text",
        "detail_link": "[itemprop='url']::attr(href), a[href*='/scholarships/']::attr(href)",
        "next_page": ".pagination .next::attr(href), a.next::attr(href)",
    })
    field_mappings: dict[str, str] = field(default_factory=lambda: {
        "title": "title",
        "funder": "provider_name",
        "amount": "award_amount",
        "detail_link": "source_url",
    })
    pagination: dict | None = field(default_factory=lambda: {
        "type": "url",
        "selector": ".pagination .next::attr(href), a.next::attr(href)",
        "max_pages": 25,
    })
    detail_page: bool = True
    detail_selectors: dict[str, str] | None = field(default_factory=lambda: {
        "description": ".description::text, .content p::text, article p::text",
        "eligibility": ".eligibility::text, .requirements::text",
        "deadline": ".deadline::text, .date::text",
        "country": ".country::text, .location::text",
        "application_url": "a.apply::attr(href), a[href*='apply']::attr(href)",
    })


CONFIG = Config()
