"""ERD Bangladesh Foreign Scholarships source configuration.

Targets the Economic Relations Division (ERD) of Bangladesh's
foreign scholarship page. SSL certificate issues require scrapling
with verify=False. Page lists government-to-government scholarship
opportunities for Bangladeshi students.
"""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseGovernmentConfig


@dataclass
class Config(BaseGovernmentConfig):
    """ERD Bangladesh Foreign Scholarships government config."""

    name: str = "ERD Bangladesh Foreign Scholarships"
    url: str = "https://erd.gov.bd/site/page/e57a61a7-57b2-44f5-8445-8e6ab0fada27/foreign-scholarship"
    source_id: str = "erd_bangladesh_foreign_scholarships"
    primary_method: str = "scrapling"
    secondary_method: str | None = None
    selectors: dict[str, str] = field(default_factory=lambda: {
        "listing": "table tr, .panel, article, .content-item, .list-group-item",
        "title": "td a::text, h2::text, h3::text, .title::text, a::text",
        "detail_link": "td a::attr(href), h2 a::attr(href), h3 a::attr(href)",
        "description": "td::text, p::text, .description::text",
        "host_country_default": "Bangladesh",
    })
    field_mappings: dict[str, str] = field(default_factory=lambda: {
        "title": "title",
        "detail_link": "source_url",
        "description": "description",
    })
    pagination: dict | None = None
    detail_page: bool = True
    detail_selectors: dict[str, str] | None = field(default_factory=lambda: {
        "description": ".content p::text, article p::text, .panel-body p::text",
        "eligibility": ".eligibility::text, ul li::text",
    })
    rate_limit_delay: float = 5.0


CONFIG = Config()
