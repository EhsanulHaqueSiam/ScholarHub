"""Scholarships360 source configuration."""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseAggregatorConfig


@dataclass
class Config(BaseAggregatorConfig):
    """Scholarships360 aggregator config."""

    name: str = "Scholarships360"
    url: str = "https://scholarships360.org"
    source_id: str = "scholarships360"
    primary_method: str = "scrape"
    secondary_method: str | None = "scrapling"
    selectors: dict[str, str] = field(default_factory=lambda: {'listing': '.scholarship-item, .result-item, article, .listing, .post, .entry', 'title': 'h2 a::text, h3 a::text, .title::text, .entry-title a::text', 'deadline': '.deadline::text, .date::text, time::text, .meta-date::text', 'country': '.country::text, .location::text, .meta-location::text', 'degree': '.degree::text, .level::text, .study-level::text', 'amount': '.amount::text, .funding::text, .value::text', 'detail_link': 'h2 a::attr(href), h3 a::attr(href), .title a::attr(href)', 'next_page': '.pagination .next::attr(href), a.next::attr(href), .nav-next a::attr(href)'})
    field_mappings: dict[str, str] = field(default_factory=lambda: {'title': 'title', 'deadline': 'application_deadline', 'amount': 'award_amount', 'detail_link': 'source_url', 'country': 'host_country', 'degree': 'degree_levels'})
    pagination: dict | None = field(default_factory=lambda: {'type': 'url', 'selector': '.pagination .next::attr(href), a.next::attr(href)', 'max_pages': 100})
    detail_page: bool = True
    detail_selectors: dict[str, str] | None = field(default_factory=lambda: {'description': '.description::text, .overview::text, .content p::text, article p::text', 'eligibility': '.eligibility::text, .requirements::text, .criteria::text', 'application_url': "a.apply::attr(href), a[href*='apply']::attr(href), a.btn-primary::attr(href)"})


CONFIG = Config()
