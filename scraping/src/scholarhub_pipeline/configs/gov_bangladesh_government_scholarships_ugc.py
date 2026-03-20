"""Bangladesh Government Scholarships (UGC) source configuration."""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseGovernmentConfig


@dataclass
class Config(BaseGovernmentConfig):
    """Bangladesh Government Scholarships (UGC) government config."""

    name: str = "Bangladesh Government Scholarships (UGC)"
    url: str = "https://www.ugc.gov.bd"
    source_id: str = "bangladesh_government_scholarships_ugc"
    primary_method: str = "scrape"
    secondary_method: str | None = "scrapling"
    selectors: dict[str, str] = field(default_factory=lambda: {'listing': '.scholarship-item, .programme, article, .content-item, .listing-item', 'title': 'h2::text, h3::text, .title::text, .programme-name::text', 'deadline': '.deadline::text, .date::text, time::text', 'provider': '.provider::text, .organization::text, .institution::text', 'amount': '.amount::text, .funding::text, .value::text', 'detail_link': 'h2 a::attr(href), h3 a::attr(href), a.title::attr(href)', 'next_page': '.pagination .next::attr(href), a.next::attr(href)'})
    field_mappings: dict[str, str] = field(default_factory=lambda: {'title': 'title', 'deadline': 'application_deadline', 'amount': 'award_amount', 'detail_link': 'source_url', 'provider': 'provider_organization'})
    pagination: dict | None = None
    detail_page: bool = False
    detail_selectors: dict[str, str] | None = None


CONFIG = Config()
