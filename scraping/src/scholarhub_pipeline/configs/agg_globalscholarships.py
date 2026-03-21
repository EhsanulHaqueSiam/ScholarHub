"""GlobalScholarships.com source configuration."""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseAggregatorConfig


@dataclass
class Config(BaseAggregatorConfig):
    """GlobalScholarships.com aggregator config.

    WordPress site with Avada/Fusion theme. Country-wise scholarship listings.
    Server-rendered HTML with Fusion page builder.
    """

    name: str = "GlobalScholarships"
    url: str = "https://www.globalscholarships.com"
    source_id: str = "globalscholarships"
    primary_method: str = "scrape"
    secondary_method: str | None = "scrapling"
    rate_limit_delay: float = 3.0
    selectors: dict[str, str] = field(default_factory=lambda: {
        "listing": "article.post, .fusion-post-grid, .post, .type-post, .entry",
        "title": "h2.entry-title a::text, h2.blog-shortcode-post-title a::text, .entry-title a::text",
        "deadline": ".fusion-meta::text, .meta-info::text, time::text",
        "country": ".fusion-meta::text, .category::text, .tag::text",
        "amount": ".amount::text, .funding::text",
        "detail_link": "h2.entry-title a::attr(href), .entry-title a::attr(href)",
        "next_page": ".pagination .next::attr(href), .fusion-pagination .next::attr(href)",
    })
    field_mappings: dict[str, str] = field(default_factory=lambda: {
        "title": "title",
        "deadline": "application_deadline",
        "amount": "award_amount",
        "detail_link": "source_url",
        "country": "host_country",
    })
    pagination: dict | None = field(default_factory=lambda: {
        "type": "url",
        "selector": ".pagination .next::attr(href), .fusion-pagination .next::attr(href)",
        "max_pages": 50,
    })
    detail_page: bool = True
    detail_selectors: dict[str, str] | None = field(default_factory=lambda: {
        "description": ".entry-content p::text, .post-content p::text, article p::text",
        "eligibility": ".eligibility::text, .requirements::text",
        "application_url": "a.apply::attr(href), a[href*='apply']::attr(href)",
    })


CONFIG = Config()
