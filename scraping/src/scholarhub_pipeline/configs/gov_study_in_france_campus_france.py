"""Study in France (Campus France) source configuration."""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseGovernmentConfig


@dataclass
class Config(BaseGovernmentConfig):
    """Study in France (Campus France) government config."""

    name: str = "Study in France (Campus France)"
    url: str = "https://www.campusfrance.org/en/scholarships"
    source_id: str = "study_in_france_campus_france"
    primary_method: str = "scrape"
    secondary_method: str | None = "scrapling"
    selectors: dict[str, str] = field(default_factory=lambda: {'listing': '.scholarship-item, .programme, article, .content-item, .listing-item', 'title': 'h2::text, h3::text, .title::text, .programme-name::text', 'deadline': '.deadline::text, .date::text, time::text', 'provider': '.provider::text, .organization::text, .institution::text', 'amount': '.amount::text, .funding::text, .value::text', 'detail_link': 'h2 a::attr(href), h3 a::attr(href), a.title::attr(href)', 'next_page': '.pagination .next::attr(href), a.next::attr(href)'})
    field_mappings: dict[str, str] = field(default_factory=lambda: {'title': 'title', 'deadline': 'application_deadline', 'amount': 'award_amount', 'detail_link': 'source_url', 'provider': 'provider_organization'})
    pagination: dict | None = field(default_factory=lambda: {'type': 'url', 'selector': '.pagination .next::attr(href), a.next::attr(href)', 'max_pages': 5})
    detail_page: bool = True
    detail_selectors: dict[str, str] | None = field(default_factory=lambda: {'description': '.description::text, .overview::text, .content p::text, article p::text', 'eligibility': '.eligibility::text, .requirements::text, .criteria::text', 'application_url': "a.apply::attr(href), a[href*='apply']::attr(href), a.btn-primary::attr(href)"})


CONFIG = Config()
