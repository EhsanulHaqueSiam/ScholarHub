"""TheGlobalScholarship.org source configuration."""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseAggregatorConfig


@dataclass
class Config(BaseAggregatorConfig):
    """TheGlobalScholarship.org aggregator config.

    CF-protected (Cloudflare challenge platform scripts detected).
    Server-rendered HTML with Swiper carousel for cards.
    Card class: .sch1, title: .schname, org: .foundationname,
    amount/deadline: .amdt, categories: .dcourses, link: a with "View".
    Extended listings via ?extended=true parameter.
    """

    name: str = "TheGlobalScholarship"
    url: str = "https://theglobalscholarship.org/scholarships/"
    source_id: str = "theglobalscholarship"
    primary_method: str = "scrapling"
    secondary_method: str | None = "scrape"
    rate_limit_delay: float = 3.0
    selectors: dict[str, str] = field(default_factory=lambda: {
        "listing": ".sch1, .swiper-slide-scroll, .swiper-slide",
        "title": ".schname::text",
        "organization": ".foundationname::text",
        "amount": ".amdt::text",
        "deadline": ".status::text, .amdt::text",
        "categories": ".dcourses::text",
        "detail_link": ".card-link::attr(href), a[href*='/scholarships/']::attr(href)",
        "next_page": "a[href*='extended=true']::attr(href)",
    })
    field_mappings: dict[str, str] = field(default_factory=lambda: {
        "title": "title",
        "organization": "provider_name",
        "amount": "award_amount",
        "deadline": "application_deadline",
        "categories": "field_of_study",
        "detail_link": "source_url",
    })
    pagination: dict | None = field(default_factory=lambda: {
        "type": "url",
        "selector": "a[href*='extended=true']::attr(href)",
        "max_pages": 10,
    })
    detail_page: bool = True
    detail_selectors: dict[str, str] | None = field(default_factory=lambda: {
        "description": ".description::text, .content p::text, article p::text",
        "eligibility": ".eligibility::text, .requirements::text",
        "country": ".country::text, .location::text",
        "application_url": "a.apply::attr(href), a[href*='apply']::attr(href)",
    })


CONFIG = Config()
