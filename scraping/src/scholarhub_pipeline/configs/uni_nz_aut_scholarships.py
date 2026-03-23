"""AUT University Scholarships source configuration.

Targets the AUT University scholarships hub page. Note: LOW confidence --
this is a hub page only; actual scholarship data may reside in the external
GivME database. Detail page following is enabled to attempt link resolution.
URL: https://www.aut.ac.nz/scholarships
"""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseOfficialConfig


@dataclass
class Config(BaseOfficialConfig):
    """AUT University Scholarships config."""

    name: str = "AUT University Scholarships"
    url: str = "https://www.aut.ac.nz/scholarships"
    source_id: str = "nz_aut_scholarships"
    primary_method: str = "scrapling"
    secondary_method: str | None = None
    selectors: dict[str, str] = field(default_factory=lambda: {
        "listing": ".scholarship-item, .card, article",
        "title": "h2 a::text, h3 a::text",
        "detail_link": "a::attr(href)",
        "description": "p::text",
        "host_country_default": "New Zealand",
    })
    field_mappings: dict[str, str] = field(default_factory=lambda: {
        "title": "title",
        "detail_link": "source_url",
        "description": "description",
    })
    pagination: dict | None = None
    detail_page: bool = True
    detail_selectors: dict[str, str] | None = field(default_factory=lambda: {
        "description": ".content p::text, article p::text",
        "eligibility": ".eligibility p::text, .requirements li::text",
        "deadline": ".deadline::text, .closing-date::text",
        "amount": ".amount::text, .value::text",
    })
    rate_limit_delay: float = 3.0


CONFIG = Config()
