"""EURAXESS Funding source configuration."""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseAggregatorConfig


@dataclass
class Config(BaseAggregatorConfig):
    """EURAXESS Funding aggregator config."""

    name: str = "EURAXESS Funding"
    url: str = "https://euraxess.ec.europa.eu/jobs/search"
    source_id: str = "euraxess_funding"
    primary_method: str = "scrape"
    secondary_method: str | None = "scrapling"
    selectors: dict[str, str] = field(default_factory=lambda: {
        "listing": ".ecl-content-item, article, .search-result",
        "title": "a.ecl-link--standalone::text, h2 a::text, h3 a::text",
        "deadline": "[class*='deadline']::text, time::text, .date::text",
        "country": "[class*='location']::text, .country::text",
        "amount": "[class*='funding']::text, .amount::text",
        "detail_link": "a.ecl-link--standalone::attr(href), h2 a::attr(href), h3 a::attr(href)",
        "next_page": ".ecl-pagination__item--next .ecl-pagination__link::attr(href), a[aria-label*='next page']::attr(href)",
    })
    field_mappings: dict[str, str] = field(default_factory=lambda: {
        "title": "title",
        "deadline": "application_deadline",
        "country": "host_country",
        "amount": "award_amount",
        "detail_link": "source_url",
    })
    pagination: dict | None = field(default_factory=lambda: {
        "type": "url",
        "selector": ".ecl-pagination__item--next .ecl-pagination__link::attr(href), a[aria-label*='next page']::attr(href)",
        "max_pages": 20,
    })
    detail_page: bool = True
    detail_selectors: dict[str, str] | None = field(default_factory=lambda: {
        "description": ".description::text, .overview::text, .content p::text, article p::text",
        "eligibility": ".eligibility::text, .requirements::text, .criteria::text",
        "application_url": "a.apply::attr(href), a[href*='apply']::attr(href), a.btn-primary::attr(href)",
    })


CONFIG = Config()
