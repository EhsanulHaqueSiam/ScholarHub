"""SHED Bangladesh Scholarships source configuration.

Targets the SHED Bangladesh government table listing ~60 scholarship
records. Uses scrapling method for the table-based layout.
"""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseGovernmentConfig


@dataclass
class Config(BaseGovernmentConfig):
    """SHED Bangladesh Scholarships government config."""

    name: str = "SHED Bangladesh Scholarships"
    url: str = "https://shed.gov.bd/pages/moedu-scholarships"
    source_id: str = "shed_bangladesh"
    primary_method: str = "scrapling"
    secondary_method: str | None = None
    selectors: dict[str, str] = field(default_factory=lambda: {
        "listing": "table tr",
        "title": "td:nth-child(2)::text",
        "detail_link": "td:nth-child(4) a::attr(href)",
        "host_country_default": "Bangladesh",
    })
    field_mappings: dict[str, str] = field(default_factory=lambda: {
        "title": "title",
        "detail_link": "source_url",
    })
    pagination: dict | None = None
    detail_page: bool = False
    rate_limit_delay: float = 5.0


CONFIG = Config()
