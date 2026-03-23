"""Anne Vallee Ecological Fund source configuration.

Targets the UBC Graduate Studies Anne Vallee Ecological Fund award page.
UBC returns 403 on direct access, requiring scrapling for browser-like
TLS fingerprint bypass.
URL: https://www.grad.ubc.ca/awards/anne-vallee-ecological-fund
"""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseOfficialConfig


@dataclass
class Config(BaseOfficialConfig):
    """Anne Vallee Ecological Fund official program config."""

    name: str = "Anne Vallee Ecological Fund"
    url: str = "https://www.grad.ubc.ca/awards/anne-vallee-ecological-fund"
    source_id: str = "canada_anne_vallee_ecological_fund"
    primary_method: str = "scrapling"
    secondary_method: str | None = None
    selectors: dict[str, str] = field(default_factory=lambda: {
        "listing": "article, .content, main",
        "title": "h1::text",
        "description": ".content p::text, article p::text",
        "host_country_default": "Canada",
    })
    field_mappings: dict[str, str] = field(default_factory=lambda: {
        "title": "title",
        "description": "description",
    })
    pagination: dict | None = None
    detail_page: bool = False
    detail_selectors: dict[str, str] | None = None
    rate_limit_delay: float = 5.0


CONFIG = Config()
