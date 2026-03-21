"""InternationalStudent.com Scholarships source configuration."""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseAggregatorConfig


@dataclass
class Config(BaseAggregatorConfig):
    """InternationalStudent.com Scholarships aggregator config.

    Server-rendered Yii framework with PJAX partial page updates.
    Award grid table at #award-grid, paginated with ?page=N&per-page=40.
    ~1,699 scholarships across ~43 pages.
    """

    name: str = "InternationalStudent.com Scholarships"
    url: str = "https://www.internationalstudent.com/scholarships/search/"
    source_id: str = "internationalstudent_scholarships"
    primary_method: str = "scrape"
    secondary_method: str | None = "scrapling"
    rate_limit_delay: float = 3.0
    selectors: dict[str, str] = field(default_factory=lambda: {
        "listing": "#award-grid tr, .award-item, table tbody tr",
        "title": "td a::text, .award-name a::text",
        "description": "td:nth-child(2)::text, .award-description::text",
        "country": ".restrictions::text, td:nth-child(3)::text",
        "detail_link": "td a::attr(href), .award-name a::attr(href)",
        "next_page": ".pagination .next a::attr(href), a[rel='next']::attr(href)",
    })
    field_mappings: dict[str, str] = field(default_factory=lambda: {
        "title": "title",
        "description": "description",
        "detail_link": "source_url",
        "country": "host_country",
    })
    pagination: dict | None = field(default_factory=lambda: {
        "type": "page_num",
        "selector": ".pagination .next a::attr(href), a[rel='next']::attr(href)",
        "max_pages": 50,
    })
    detail_page: bool = True
    detail_selectors: dict[str, str] | None = field(default_factory=lambda: {
        "description": ".description::text, .content p::text, .award-detail p::text",
        "eligibility": ".eligibility::text, .requirements::text, .nationality::text",
        "deadline": ".deadline::text, .date::text",
        "amount": ".amount::text, .award-amount::text",
        "application_url": "a.apply::attr(href), a[href*='apply']::attr(href)",
    })


CONFIG = Config()
