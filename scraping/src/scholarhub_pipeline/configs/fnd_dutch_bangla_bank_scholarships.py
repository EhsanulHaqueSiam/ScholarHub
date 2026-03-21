"""Dutch-Bangla Bank Scholarships source configuration.

Targets the Dutch-Bangla Bank Limited CSR scholarship pages.
DBBL is Bangladesh's largest private donor to social causes and
runs scholarship programmes for Bangladeshi students. Uses scrapling
due to dynamic content loading.
"""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseFoundationConfig


@dataclass
class Config(BaseFoundationConfig):
    """Dutch-Bangla Bank Scholarships foundation config."""

    name: str = "Dutch-Bangla Bank Scholarships"
    url: str = "https://www.dutchbanglabank.com/csr-research/research.html"
    source_id: str = "dutch_bangla_bank_scholarships"
    primary_method: str = "scrapling"
    secondary_method: str | None = None
    selectors: dict[str, str] = field(default_factory=lambda: {
        "listing": "article, .content-section, section, .panel, .card",
        "title": "h1::text, h2::text, h3::text, .title::text",
        "detail_link": "a::attr(href)",
        "description": "p::text, .content p::text, .description::text",
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
    rate_limit_delay: float = 4.0


CONFIG = Config()
