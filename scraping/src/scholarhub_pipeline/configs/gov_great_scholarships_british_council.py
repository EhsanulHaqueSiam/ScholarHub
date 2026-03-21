"""GREAT Scholarships (British Council) source configuration.

Targets the Study UK British Council GREAT Scholarships page.
Returns 403 on direct access, requiring scrapling method.
Lists UK university scholarships for international students.
"""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseGovernmentConfig


@dataclass
class Config(BaseGovernmentConfig):
    """GREAT Scholarships (British Council) government config."""

    name: str = "GREAT Scholarships (British Council)"
    url: str = "https://study-uk.britishcouncil.org/scholarships/great-scholarships"
    source_id: str = "great_scholarships_british_council"
    primary_method: str = "scrapling"
    secondary_method: str | None = None
    selectors: dict[str, str] = field(default_factory=lambda: {
        "listing": ".scholarship-card, .card, article, .views-row, .listing-item",
        "title": "h2::text, h3::text, .card-title::text, a::text",
        "detail_link": "h2 a::attr(href), h3 a::attr(href), .card a::attr(href)",
        "description": "p::text, .card-body p::text, .summary::text",
        "university": ".university::text, .institution::text, .provider::text",
        "host_country_default": "United Kingdom",
    })
    field_mappings: dict[str, str] = field(default_factory=lambda: {
        "title": "title",
        "detail_link": "source_url",
        "description": "description",
        "university": "provider_organization",
    })
    pagination: dict | None = None
    detail_page: bool = True
    detail_selectors: dict[str, str] | None = field(default_factory=lambda: {
        "description": ".field-body p::text, article p::text, .content p::text",
        "eligibility": ".eligibility p::text, .requirements li::text",
        "deadline": ".deadline::text, .date::text",
        "amount": ".amount::text, .value::text, .funding::text",
    })
    rate_limit_delay: float = 5.0


CONFIG = Config()
