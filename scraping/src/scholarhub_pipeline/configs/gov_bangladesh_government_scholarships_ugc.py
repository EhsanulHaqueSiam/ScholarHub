"""Bangladesh Government Scholarships (UGC) source configuration."""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseGovernmentConfig


@dataclass
class Config(BaseGovernmentConfig):
    """Bangladesh Government Scholarships (UGC) government config."""

    name: str = "Bangladesh Government Scholarships (UGC)"
    url: str = "https://shed.gov.bd/pages/moedu-scholarships"
    source_id: str = "bangladesh_government_scholarships_ugc"
    primary_method: str = "scrape"
    secondary_method: str | None = "scrapling"
    selectors: dict[str, str] = field(default_factory=lambda: {
        "listing": "table tr",
        "title": "td:nth-child(2)::text, td:nth-child(1)::text",
        "detail_link": "td:nth-child(4) a::attr(href), td a::attr(href)",
        "deadline": "td:nth-child(3)::text",
    })
    field_mappings: dict[str, str] = field(default_factory=lambda: {
        "title": "title",
        "deadline": "application_deadline",
        "detail_link": "source_url",
    })
    pagination: dict | None = None
    detail_page: bool = False
    detail_selectors: dict[str, str] | None = None
    method_timeout_seconds: float = 20.0


CONFIG = Config()
