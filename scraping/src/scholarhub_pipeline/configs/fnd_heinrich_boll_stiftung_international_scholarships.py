"""Heinrich Boll Stiftung International Scholarships source configuration."""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseFoundationConfig


@dataclass
class Config(BaseFoundationConfig):
    """Heinrich Boll Stiftung International Scholarships foundation config."""

    name: str = "Heinrich Boll Stiftung International Scholarships"
    url: str = "https://www.boell.de/en/foundation/scholarships"
    source_id: str = "heinrich_boll_stiftung_international_scholarships"
    primary_method: str = "scrape"
    secondary_method: str | None = "scrapling"
    selectors: dict[str, str] = field(default_factory=lambda: {'listing': '.scholarship-item, .programme, article, .grant-item, .fellowship', 'title': 'h2::text, h3::text, .title::text, .fellowship-title::text', 'deadline': '.deadline::text, .date::text, .closing-date::text', 'eligibility': '.eligibility::text, .requirements::text', 'amount': '.amount::text, .funding::text, .award::text', 'detail_link': 'h2 a::attr(href), h3 a::attr(href), a::attr(href)'})
    field_mappings: dict[str, str] = field(default_factory=lambda: {'title': 'title', 'deadline': 'application_deadline', 'amount': 'award_amount', 'detail_link': 'source_url', 'eligibility': 'eligibility_criteria'})
    pagination: dict | None = None
    detail_page: bool = False
    detail_selectors: dict[str, str] | None = None


CONFIG = Config()
